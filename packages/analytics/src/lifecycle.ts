import { eventDigest, type Analytics } from "./client";
import type { Step, RunMode } from "./schema";

export type RunReceipt = {
  started: boolean;
  completed: boolean;
  failedStep?: Step;
  mode: RunMode;
};
const steps = [
  "crawl",
  "capture",
  "extract",
  "describe",
  "synthesize",
  "render",
];

/** Read only these persisted fields; never copy a run or error into an event. */
export function runReceipt(
  run: {
    startedAt?: number;
    status: string;
    mode?: string;
    error?: { step?: string } | string;
  },
  previousStartedAt?: number,
): RunReceipt {
  const step = typeof run.error === "object" ? run.error?.step : undefined;
  return {
    started:
      typeof run.startedAt === "number" && previousStartedAt === undefined,
    completed: run.status === "completed",
    failedStep:
      run.status === "failed" && steps.includes(step ?? "")
        ? (step as Step)
        : undefined,
    mode: run.mode === "text_only" ? "text_only" : "visual",
  };
}

/** Called on acknowledged step responses only. Never on render, refresh, or network errors. */
export async function captureRunReceipt(
  analytics: Analytics,
  runId: string,
  receipt: RunReceipt | undefined,
) {
  if (
    !analytics.ready() ||
    !receipt ||
    !["visual", "text_only"].includes(receipt.mode)
  )
    return;
  try {
    // Run IDs are used locally for idempotency, never sent to PostHog.
    // Repeated steps, retries, remounts, and multiple tabs resolve to the same event UUID.
    if (receipt.started === true)
      analytics.capture({
        event: "run_started",
        properties: {
          mode: receipt.mode,
          $insert_id: await eventDigest(`run_started:${runId}`),
        },
      });
    if (receipt.completed === true)
      analytics.capture({
        event: "run_completed",
        properties: {
          mode: receipt.mode,
          $insert_id: await eventDigest(`run_completed:${runId}`),
        },
      });
    else if (steps.includes(receipt.failedStep ?? ""))
      analytics.capture({
        event: "run_failed",
        properties: {
          mode: receipt.mode,
          step: receipt.failedStep!,
          $insert_id: await eventDigest(`run_failed:${runId}:${receipt.mode}`),
        },
      });
  } catch {
    /* Hash/transport failures must not affect the run UI. */
  }
}
