import { tool } from "ai";
import { z } from "zod";

import {
  CAPTURE_RUNTIME_VERSION,
  captureSnapshotName,
  createDaytonaClient,
  daytonaOpenUrl,
  daytonaScreenshotFullPage,
  daytonaScreenshotViewport,
  daytonaSpawn,
  daytonaStop,
  ensureDaytonaCaptureSnapshot,
  type CaptureRuntimeStatus,
  type ScreenshotArtifact,
} from "@getdesign/tools/daytona";

const visualInputSchema = z.object({
  url: z.string().url(),
  /**
   * Optional override for the Daytona snapshot name. When omitted, the
   * versioned `captureSnapshotName()` helper is used and ensured automatically.
   * Advanced override only; the v1 product surface should not expose this.
   */
  snapshot: z.string().trim().min(1).optional(),
  captureFullPage: z.boolean().optional().default(false),
  fullPageSteps: z.number().int().positive().max(12).optional().default(4),
  scrollStepPx: z.number().int().positive().max(2000).optional().default(900),
});

export type VisualInput = z.input<typeof visualInputSchema>;

export type VisualRunOptions = {
  /**
   * Request-scoped Daytona API key. When omitted, the agent falls back to
   * the `DAYTONA_API_KEY` env var. Hosted runs should pass this explicitly
   * so per-user BYOK credentials are never confused with process-level keys.
   */
  daytonaApiKey?: string;
  /**
   * Hook that observes capture runtime provisioning status. Useful so API/CLI
   * surfaces can emit `provisioning_capture_runtime`/`capture_runtime_ready`/
   * `capture_runtime_failed` events without coupling to the snapshot helper.
   */
  onCaptureRuntimeStatus?: (event: {
    status: CaptureRuntimeStatus;
    snapshotName: string;
    message?: string;
  }) => void;
};

export type VisualScreenshots = {
  hero?: ScreenshotArtifact;
  fullPage?: ScreenshotArtifact;
};

export type VisualResult =
  | {
      status: "captured";
      hero?: ScreenshotArtifact;
      fullPage?: ScreenshotArtifact;
      snapshot: string;
      runtimeVersion: string;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      /**
       * Snapshot provisioning failed before any rendering happened. The run
       * coordinator should surface an actionable error and offer text_only.
       */
      status: "runtime_unavailable";
      reason: string;
      snapshot?: string;
    }
  | {
      /** Capture failed after the runtime was ready. */
      status: "failed";
      reason: string;
      snapshot?: string;
    };

/**
 * Run the VisualAgent. When no Daytona key is available the run is skipped.
 * When a key is available, the per-user capture snapshot is auto-ensured
 * before opening the URL. Provisioning failures surface as
 * `runtime_unavailable` so the coordinator can offer a marked text-only run.
 */
export async function runVisual(
  input: VisualInput,
  options: VisualRunOptions = {},
): Promise<VisualResult> {
  const parsed = visualInputSchema.parse(input);

  const apiKey = options.daytonaApiKey ?? process.env.DAYTONA_API_KEY;
  if (!apiKey) {
    return {
      status: "skipped",
      reason:
        "No Daytona API key available; provide one via stored credentials, request-scoped credentials, or DAYTONA_API_KEY.",
    };
  }

  const client = createDaytonaClient({ apiKey });
  const snapshotName = parsed.snapshot ?? captureSnapshotName();

  const ensureResult = await ensureDaytonaCaptureSnapshot(client, {
    snapshotName,
    onStatus: options.onCaptureRuntimeStatus,
  });

  if (ensureResult.status !== "ready") {
    return {
      status: "runtime_unavailable",
      reason:
        ensureResult.reason ??
        `Capture runtime snapshot ${snapshotName} is not ready.`,
      snapshot: snapshotName,
    };
  }

  let sandbox: Awaited<ReturnType<typeof daytonaSpawn>> | null = null;

  try {
    sandbox = await daytonaSpawn(client, { snapshot: snapshotName });
    await daytonaOpenUrl(sandbox, parsed.url);
    const hero = await daytonaScreenshotViewport(sandbox);

    let fullPage: ScreenshotArtifact | undefined;
    if (parsed.captureFullPage) {
      const activeSandbox = sandbox;
      fullPage = await daytonaScreenshotFullPage({
        capture: () => daytonaScreenshotViewport(activeSandbox),
        scroll: async (step) => {
          await activeSandbox.computerUse.mouse.scroll(720, 450, "down", step);
        },
        steps: parsed.fullPageSteps,
        scrollStepPx: parsed.scrollStepPx,
      });
    }

    return {
      status: "captured",
      snapshot: snapshotName,
      runtimeVersion: CAPTURE_RUNTIME_VERSION,
      hero,
      fullPage,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown Daytona error",
      snapshot: snapshotName,
    };
  } finally {
    if (sandbox) {
      try {
        await daytonaStop(sandbox);
      } catch {
        // best-effort teardown
      }
    }
  }
}

export function summarizeVisual(result: VisualResult): Record<string, unknown> {
  if (result.status === "captured") {
    return {
      status: result.status,
      snapshot: result.snapshot,
      runtimeVersion: result.runtimeVersion,
      heroBytes: result.hero?.sizeBytes ?? result.hero?.imageBase64.length,
      heroWidth: result.hero?.width,
      heroHeight: result.hero?.height,
      fullPageBytes:
        result.fullPage?.sizeBytes ?? result.fullPage?.imageBase64.length,
      fullPageHeight: result.fullPage?.height,
    };
  }
  if (result.status === "runtime_unavailable" || result.status === "failed") {
    return {
      status: result.status,
      reason: result.reason,
      snapshot: result.snapshot,
    };
  }
  return { status: result.status, reason: result.reason };
}

export function createVisualTool(
  sink: { visual?: VisualResult },
  options: VisualRunOptions = {},
) {
  return tool({
    description:
      "Capture a hero screenshot of the URL inside the user's Daytona capture runtime. Auto-provisions the per-user snapshot when missing; returns status: 'skipped' or 'runtime_unavailable' when capture cannot proceed.",
    inputSchema: visualInputSchema,
    execute: async (input) => {
      const result = await runVisual(input, options);
      sink.visual = result;
      return summarizeVisual(result);
    },
  });
}
