import { createHash } from "node:crypto";
import { type FSWatcher, watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { StudioDeckPlan } from "../shared/studio-api";

const DECK_PLAN_FILE = "deck-plan.json";

/** Time we coalesce rapid-fire fs.watch events for the same file. Long enough
 * to absorb non-atomic writes (e.g., python `open('w')` that produces multiple
 * change events), short enough that the user doesn't perceive the delay. */
const DEBOUNCE_MS = 150;

/** How long we keep retrying parse if the file looks half-written. */
const PARSE_RETRY_MS = 200;
const PARSE_MAX_ATTEMPTS = 3;

export type DeckPlanEvent = {
  artifactId: string;
  artifactPath: string;
  plan: StudioDeckPlan;
  contentHash: string;
};

type WatcherCallback = (event: DeckPlanEvent) => void | Promise<void>;

/**
 * Watches a single artifact directory for `deck-plan.json` changes. Strategy:
 * `fs.watch` (cheap OS-native event) → 150ms debounce → guarded `JSON.parse`.
 * The JSON guard handles the case where fs.watch fires while a non-atomic
 * writer (Python heredoc, shell redirect) is mid-write and the file is not yet
 * valid JSON; we retry briefly before giving up.
 *
 * The watcher is single-artifact by design — only the chat thread's currently
 * active artifact needs a live watcher. Switching threads stops the old
 * watcher and starts a new one.
 */
export class DeckPlanWatcher {
  private fsWatcher: FSWatcher | undefined;
  private artifactId: string | undefined;
  private artifactPath: string | undefined;
  private callback: WatcherCallback | undefined;
  private debounceTimer: NodeJS.Timeout | undefined;
  /** Last hash we emitted, used to silence no-op writes (e.g., the watcher
   * fires on the file write that our own confirmDeckPlan IPC just made and
   * we'd otherwise re-emit immediately). */
  private lastEmittedHash: string | undefined;

  start(artifactId: string, artifactPath: string, callback: WatcherCallback): void {
    if (this.artifactId === artifactId && this.fsWatcher) return;
    this.stop();
    this.artifactId = artifactId;
    this.artifactPath = artifactPath;
    this.callback = callback;
    this.lastEmittedHash = undefined;

    try {
      // Watch the artifact directory rather than the file itself: the file may
      // not exist yet when the watcher starts (the agent hasn't written
      // deck-plan.json), and `fs.watch` errors on a missing path. Directory
      // watching catches creates, modifies, and renames uniformly.
      this.fsWatcher = watch(artifactPath, (_eventType, filename) => {
        const watchedName = filename == null ? undefined : String(filename);
        if (watchedName && watchedName !== DECK_PLAN_FILE) return;
        this.scheduleEmit();
      });
      this.fsWatcher.on("error", () => {
        // Swallow — watcher will be restarted on next thread switch. Common
        // cause: artifact directory was deleted out from under us.
      });
    } catch {
      // Directory may not exist yet (rare — ensureArtifactWorkspace usually
      // creates it first). Caller is expected to retry on next thread switch.
      this.fsWatcher = undefined;
    }

    // One-shot defensive sync on start: if a deck-plan.json already exists
    // (e.g., user re-opened a chat that had a plan written before this
    // feature shipped, or the watcher missed a previous write), emit it now
    // so the chat card appears. Per Q8 we only do this once per watcher
    // session — Q4's hash logic dedupes against any existing card.
    void this.tryEmit();
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this.fsWatcher?.close();
    this.fsWatcher = undefined;
    this.artifactId = undefined;
    this.artifactPath = undefined;
    this.callback = undefined;
    this.lastEmittedHash = undefined;
  }

  private scheduleEmit(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.tryEmit();
    }, DEBOUNCE_MS);
  }

  private async tryEmit(attempt = 1): Promise<void> {
    const artifactId = this.artifactId;
    const artifactPath = this.artifactPath;
    const callback = this.callback;
    if (!artifactId || !artifactPath || !callback) return;

    const planPath = join(artifactPath, DECK_PLAN_FILE);
    let raw: string;
    try {
      raw = await readFile(planPath, "utf8");
    } catch {
      // File doesn't exist (agent deleted it / never wrote it). Reset hash so
      // a future write counts as a new event.
      this.lastEmittedHash = undefined;
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Half-written file — retry a couple of times before giving up. Most
      // non-atomic writers complete within a frame.
      if (attempt < PARSE_MAX_ATTEMPTS) {
        setTimeout(() => void this.tryEmit(attempt + 1), PARSE_RETRY_MS);
      }
      return;
    }

    const plan = coercePlan(parsed);
    if (!plan) return;

    const contentHash = computeContentHash(plan);
    // Same exact JSON byte-for-byte is a no-op (defends against double fs.watch
    // events). Note: a status-only change (pending → confirmed) DOES produce a
    // different hash here because confirmedAt + status are part of the file —
    // but we want the chat-controller to see it (it dedupes by *content* hash
    // = plan fields excluding status/confirmedAt — see chat-controller logic).
    const fileHash = sha256(raw);
    if (fileHash === this.lastEmittedHash) return;
    this.lastEmittedHash = fileHash;

    await callback({ artifactId, artifactPath, plan, contentHash });
  }
}

/** Hash computed over the *content* fields only — status + confirmedAt are
 * intentionally excluded so a pending → confirmed transition produces the same
 * content hash and the chat controller mutates the existing card instead of
 * appending a new one (Q4). */
export function computeContentHash(plan: StudioDeckPlan): string {
  const canonical = JSON.stringify({
    audience: plan.audience ?? "",
    keyMessage: plan.keyMessage ?? "",
    exportPath: plan.exportPath ?? "",
    slideCount: plan.slideCount ?? 0,
    mode: plan.mode ?? "",
    notes: plan.notes ?? "",
  });
  return sha256(canonical);
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function coercePlan(value: unknown): StudioDeckPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const audience = typeof obj.audience === "string" ? obj.audience : "";
  const keyMessage = typeof obj.keyMessage === "string" ? obj.keyMessage : "";
  const exportPath = obj.exportPath;
  const slideCount = typeof obj.slideCount === "number" ? obj.slideCount : 0;
  const mode = obj.mode;
  const status = obj.status === "confirmed" ? "confirmed" : "pending";
  const createdAt = typeof obj.createdAt === "number" ? obj.createdAt : Date.now();
  if (
    exportPath !== "html" &&
    exportPath !== "html-pdf" &&
    exportPath !== "pptx"
  ) {
    return undefined;
  }
  if (mode !== "freeform" && mode !== "pptx-safe") return undefined;
  return {
    audience,
    keyMessage,
    exportPath,
    slideCount,
    mode,
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
    status,
    createdAt,
    confirmedAt: typeof obj.confirmedAt === "number" ? obj.confirmedAt : undefined,
  };
}
