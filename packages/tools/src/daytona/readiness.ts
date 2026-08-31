import type { Sandbox } from "@daytonaio/sdk";

import { measurePageReadiness } from "./measurement.js";
import type { ReadinessSnapshot } from "./readiness-inspection.js";
import type { CapturePhaseHandler, Viewport } from "./types.js";

export class CaptureReadinessError extends Error {
  readonly code = "capture_not_ready";

  constructor(readonly reason: string) {
    const advice = reason === "protected_gate"
      ? "The page requires a login, consent, age, payment, or verification step. Use a public, ungated URL. These controls are not clicked."
      : reason === "probe_unavailable"
        ? "Could not verify page readiness. Retry capture; check the sandbox browser and its local measurement probe if this persists."
        : "The page is still loading or shows an unsupported entry screen. Retry after the site loads, or use a direct public content URL.";
    super(`Capture not ready (${reason}). ${advice} Text-only output requires explicit opt-in.`);
    this.name = "CaptureReadinessError";
  }
}

type ReadinessOptions = {
  viewport: Viewport;
  /** Total readiness budget, capped at 30 seconds. Default: 20 seconds. */
  timeoutMs?: number;
  onPhase?: CapturePhaseHandler;
};

/** Also bound SDK calls if a transport ignores its server-side timeout. */
async function withinDeadline<T>(work: Promise<T>, deadline: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CaptureReadinessError("readiness_timeout")), Math.max(1, deadline - Date.now()));
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function boundedMeasurement(sandbox: Sandbox, deadline: number): Promise<ReadinessSnapshot> {
  try {
    const snapshot = await withinDeadline(measurePageReadiness(sandbox, deadline - Date.now()), deadline);
    if (Date.now() >= deadline) throw new CaptureReadinessError("readiness_timeout");
    return snapshot;
  } catch (error) {
    if (error instanceof CaptureReadinessError) throw error;
    throw new CaptureReadinessError("probe_unavailable");
  }
}

/** Measurement/scrolling can expose a late gate. Recheck before the first tile, without clicking again. */
export async function assertCaptureStillReady(sandbox: Sandbox, onPhase?: CapturePhaseHandler): Promise<void> {
  try {
    const snapshot = await boundedMeasurement(sandbox, Date.now() + 5_000);
    if (snapshot.state !== "ready") throw new CaptureReadinessError(snapshot.reason);
  } catch (error) {
    onPhase?.({ phase: "ready_state", status: "error", detail: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Require two matching content observations at least 500ms apart. A known
 * loader is waited out; a stable allowlisted intro button may be clicked once
 * through Computer Use. Unknown and protected gates fail without interaction.
 */
export async function waitForCaptureReadiness(sandbox: Sandbox, options: ReadinessOptions): Promise<void> {
  const requested = options.timeoutMs ?? 20_000;
  if (!Number.isFinite(requested) || requested < 1) throw new Error("readinessTimeoutMs must be a positive finite number.");
  const started = Date.now();
  const deadline = started + Math.min(requested, 30_000);
  let previous: ReadinessSnapshot | undefined;
  let clicked = false;
  let lastReason = "readiness_timeout";
  options.onPhase?.({ phase: "ready_state", status: "start", detail: "checking visible content" });
  try {
    // A poll cap protects against clock changes as well as slow pages.
    for (let poll = 0; poll < 60 && Date.now() < deadline; poll += 1) {
      const snapshot = await boundedMeasurement(sandbox, deadline);
      lastReason = snapshot.reason;
      const stable = previous?.state === snapshot.state && previous.signature === snapshot.signature;
      if (snapshot.state === "blocked") throw new CaptureReadinessError(snapshot.reason);
      if (snapshot.state === "ready" && stable) {
        options.onPhase?.({ phase: "ready_state", status: "ok", detail: clicked ? "content ready after intro click" : "content ready", durationMs: Date.now() - started });
        return;
      }
      if (snapshot.state === "gate" && stable && !clicked) {
        const { target, viewport } = snapshot;
        // Kiosk CSS coordinates must match the Computer Use display. Never
        // guess a click when scaling or a viewport mismatch changes the target.
        if (!target || viewport.dpr !== 1 || viewport.width !== options.viewport.width || viewport.height !== options.viewport.height ||
          target.x < 0 || target.y < 0 || target.x >= viewport.width || target.y >= viewport.height) {
          throw new CaptureReadinessError("unsafe_gate_coordinates");
        }
        clicked = true;
        options.onPhase?.({ phase: "ready_state", status: "warn", detail: "clicking one verified intro button via Computer Use" });
        await withinDeadline(sandbox.computerUse.mouse.click(target.x, target.y), deadline);
        previous = undefined;
      } else {
        previous = snapshot;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.min(500, Math.max(0, deadline - Date.now()))));
    }
    throw new CaptureReadinessError(lastReason === "benign_intro" ? "persistent_gate" : lastReason);
  } catch (error) {
    options.onPhase?.({ phase: "ready_state", status: "error", detail: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started });
    throw error;
  }
}
