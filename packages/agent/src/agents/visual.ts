import { tool } from "ai";
import { z } from "zod";

import {
  createDaytonaClient,
  daytonaOpenUrl,
  daytonaScreenshotFullPage,
  daytonaScreenshotViewport,
  daytonaSpawn,
  daytonaStop,
  getDefaultSnapshotName,
  type ScreenshotArtifact,
} from "@getdesign/tools/daytona";

const visualInputSchema = z.object({
  url: z.string().url(),
  snapshot: z.string().trim().min(1).optional(),
  captureFullPage: z.boolean().optional().default(false),
  fullPageSteps: z.number().int().positive().max(12).optional().default(4),
  scrollStepPx: z.number().int().positive().max(2000).optional().default(900),
});

export type VisualInput = z.input<typeof visualInputSchema>;

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
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      reason: string;
    };

/**
 * Run the VisualAgent. When `DAYTONA_API_KEY` is not set, this is a no-op
 * that returns `{ status: "skipped" }` so downstream steps can continue
 * without a hero screenshot.
 */
export async function runVisual(input: VisualInput): Promise<VisualResult> {
  const parsed = visualInputSchema.parse(input);

  if (!process.env.DAYTONA_API_KEY) {
    return {
      status: "skipped",
      reason: "DAYTONA_API_KEY is not set; continuing without screenshots.",
    };
  }

  const client = createDaytonaClient();
  const snapshot = parsed.snapshot ?? getDefaultSnapshotName();
  let sandbox: Awaited<ReturnType<typeof daytonaSpawn>> | null = null;

  try {
    sandbox = await daytonaSpawn(client, { snapshot });
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
      snapshot,
      hero,
      fullPage,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown Daytona error",
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
      heroBytes: result.hero?.sizeBytes ?? result.hero?.imageBase64.length,
      heroWidth: result.hero?.width,
      heroHeight: result.hero?.height,
      fullPageBytes:
        result.fullPage?.sizeBytes ?? result.fullPage?.imageBase64.length,
      fullPageHeight: result.fullPage?.height,
    };
  }
  return { status: result.status, reason: result.reason };
}

export function createVisualTool(sink: { visual?: VisualResult }) {
  return tool({
    description:
      "Capture a hero screenshot of the URL inside a Daytona sandbox. Gated on DAYTONA_API_KEY; returns status: 'skipped' when unavailable.",
    inputSchema: visualInputSchema,
    execute: async (input) => {
      const result = await runVisual(input);
      sink.visual = result;
      return summarizeVisual(result);
    },
  });
}
