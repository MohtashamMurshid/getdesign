import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { ScreenshotArtifact } from "@getdesign/tools/daytona";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

export type RunStep =
  | "crawl"
  | "capture"
  | "describe"
  | "extract"
  | "synthesize"
  | "render";

export type StepStatus = "pending" | "running" | "ok" | "skipped" | "failed";

export type RunState = {
  id: string;
  url: string;
  siteName?: string;
  userId: string;
  userEmail?: string;
  status: "queued" | "running" | "completed" | "failed";
  currentStep?: RunStep;
  message?: string;
  error?: string;
  steps: Record<RunStep, StepStatus>;
  mode?: "visual" | "text_only";
  tiles?: number;
  markdownLength?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type StoredVisual = {
  status: "captured" | "skipped" | "failed";
  reason?: string;
  attempts?: number;
  tiles: Array<{
    file: string;
    width: number;
    height: number;
    format: "png";
  }>;
  documentHeight?: number;
  documentWidth?: number;
  viewport?: { width: number; height: number };
  measurementMode?: string;
  installedI18nFonts?: boolean;
  durationsMs?: unknown;
};

const STEP_ORDER: RunStep[] = [
  "crawl",
  "capture",
  "describe",
  "extract",
  "synthesize",
  "render",
];

export function runsRoot() {
  return path.resolve(process.cwd(), "../../getdesign-runs");
}

export function assertRunId(id: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/i.test(id)) {
    throw new Error("Invalid run id.");
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function createRunId(url: string) {
  const base = slugify(new URL(url).hostname) || "run";
  return `${base}-${Date.now().toString(36)}`;
}

export function runDir(id: string) {
  assertRunId(id);
  return path.join(runsRoot(), id);
}

function statePath(id: string) {
  return path.join(runDir(id), "state.json");
}

function artifactPath(id: string, name: string) {
  return path.join(runDir(id), name);
}

export function initialSteps(): RunState["steps"] {
  return {
    crawl: "pending",
    capture: "pending",
    describe: "pending",
    extract: "pending",
    synthesize: "pending",
    render: "pending",
  };
}

export async function createRun(input: {
  id: string;
  url: string;
  siteName?: string;
  userId: string;
  userEmail?: string;
}) {
  const now = Date.now();
  const state: RunState = {
    id: input.id,
    url: input.url,
    siteName: input.siteName,
    userId: input.userId,
    userEmail: input.userEmail,
    status: "queued",
    message: "Queued",
    steps: initialSteps(),
    createdAt: now,
    updatedAt: now,
  };

  await mkdir(path.join(runDir(input.id), "tiles"), { recursive: true });
  await saveState(state);
  return state;
}

export async function loadState(id: string) {
  return JSON.parse(await readFile(statePath(id), "utf8")) as RunState;
}

export async function saveState(state: RunState) {
  await mkdir(runDir(state.id), { recursive: true });
  await writeFile(
    statePath(state.id),
    `${JSON.stringify({ ...state, updatedAt: Date.now() }, null, 2)}\n`,
    "utf8",
  );
}

export async function updateStep(
  id: string,
  step: RunStep,
  status: StepStatus,
  message: string,
  patch: Partial<RunState> = {},
) {
  const state = await loadState(id);
  const next: RunState = {
    ...state,
    ...patch,
    status:
      status === "failed"
        ? "failed"
        : patch.status ?? (status === "running" ? "running" : state.status),
    currentStep: step,
    message,
    error: status === "failed" ? patch.error ?? message : undefined,
    steps: {
      ...state.steps,
      [step]: status,
    },
  };
  await saveState(next);
  return next;
}

export async function assertOwner(id: string, userId: string) {
  const state = await loadState(id);
  if (state.userId !== userId) {
    throw new Error("Run not found.");
  }
  return state;
}

export async function saveCrawl(id: string, crawl: CrawlSiteResult) {
  await writeJson(id, "crawl.json", crawl);
}

export async function loadCrawl(id: string) {
  return readJson<CrawlSiteResult>(id, "crawl.json");
}

export async function saveVisual(id: string, visual: StoredVisual) {
  await writeJson(id, "visual.json", visual);
}

export async function loadVisual(id: string) {
  return readJson<StoredVisual>(id, "visual.json");
}

export async function saveDescription(id: string, description: string) {
  await writeFile(artifactPath(id, "description.md"), description, "utf8");
}

export async function loadDescription(id: string) {
  return readFile(artifactPath(id, "description.md"), "utf8");
}

export async function saveTokens(id: string, tokens: DesignTokens) {
  await writeJson(id, "tokens.json", tokens);
}

export async function loadTokens(id: string) {
  return readJson<DesignTokens>(id, "tokens.json");
}

export async function saveDoc(id: string, doc: DesignDoc) {
  await writeJson(id, "doc.json", doc);
}

export async function loadDoc(id: string) {
  return readJson<DesignDoc>(id, "doc.json");
}

export async function saveMarkdown(id: string, markdown: string) {
  await writeFile(artifactPath(id, "design.md"), markdown, "utf8");
}

export async function loadTileArtifacts(id: string): Promise<ScreenshotArtifact[]> {
  const visual = await loadVisual(id);
  if (visual.status !== "captured") return [];

  return Promise.all(
    visual.tiles.map(async (tile) => ({
      imageBase64: await readFile(
        path.join(runDir(id), "tiles", tile.file),
        "base64",
      ),
      width: tile.width,
      height: tile.height,
      format: tile.format,
    })),
  );
}

export async function saveTilePngs(
  id: string,
  tiles: Array<{ pngBase64: string; width: number; height: number }>,
) {
  const tilesDir = path.join(runDir(id), "tiles");
  await mkdir(tilesDir, { recursive: true });

  return Promise.all(
    tiles.map(async (tile, index) => {
      const file = `${String(index).padStart(3, "0")}.png`;
      await writeFile(path.join(tilesDir, file), Buffer.from(tile.pngBase64, "base64"));
      return {
        file,
        width: tile.width,
        height: tile.height,
        format: "png" as const,
      };
    }),
  );
}

export async function listCompletedRuns() {
  const root = runsRoot();
  let entries: string[] = [];
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }

  return entries.filter((id) => id && !id.startsWith("."));
}

async function writeJson(id: string, name: string, value: unknown) {
  await writeFile(
    artifactPath(id, name),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function readJson<T>(id: string, name: string) {
  return JSON.parse(await readFile(artifactPath(id, name), "utf8")) as T;
}

export function nextStepAfter(step: RunStep): RunStep | undefined {
  const index = STEP_ORDER.indexOf(step);
  return STEP_ORDER[index + 1];
}
