import { tool } from "ai";
import { z } from "zod";

import {
  runCapture,
  shouldInstallI18nFonts,
  stitchCaptureTiles,
  type CaptureMeasurementMode,
  type CapturePhaseEvent,
  type CaptureResult,
  type ScreenshotArtifact,
} from "@getdesign/tools/daytona";

const visualInputSchema = z.object({
  url: z.string().url(),
  installI18nFonts: z.boolean().optional(),
  measurementMode: z.enum(["cdp", "visual", "auto"]).optional(),
});

export type VisualInput = z.input<typeof visualInputSchema>;

export type VisualRunOptions = {
  /**
   * Per-run Daytona key. When omitted, falls back to `DAYTONA_API_KEY`.
   */
  daytonaApiKey?: string;
  /**
   * Hook that observes capture phase events (sandbox_create, prepare, fonts,
   * chromium_launch, measure, tiles, etc.) so coordinators can surface them
   * to the user.
   */
  onCapturePhase?: (event: CapturePhaseEvent) => void;
  /**
   * Maximum total attempts before reporting `failed`. Defaults to 3 per
   * ADR 0001's full landing page capture retry contract.
   */
  maxAttempts?: number;
};

export type VisualResult =
  | {
      status: "captured";
      hero: ScreenshotArtifact;
      fullPage: ScreenshotArtifact;
      tiles: CaptureResult["tiles"];
      documentHeight: number;
      documentWidth: number;
      viewport: CaptureResult["viewport"];
      measurementMode: CaptureMeasurementMode;
      installedI18nFonts: boolean;
      durationsMs: CaptureResult["durationsMs"];
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      reason: string;
      attempts: number;
    };

function tileToArtifact(tile: CaptureResult["tiles"][number]): ScreenshotArtifact {
  return {
    imageBase64: tile.pngBase64,
    width: tile.width,
    height: tile.height,
    format: "png",
  };
}

/**
 * Run the VisualAgent. When no Daytona key is available the run is skipped.
 * Otherwise we run the full Computer Use capture pipeline (default sandbox
 * + in-sandbox Chromium + CDP-or-visual-stability measurement + tile
 * capture) with up to `maxAttempts` retries against fresh sandboxes.
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

  const installI18nFonts =
    parsed.installI18nFonts ?? shouldInstallI18nFonts(parsed.url);
  const maxAttempts = options.maxAttempts ?? 3;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const capture = await runCapture({
        daytonaApiKey: apiKey,
        url: parsed.url,
        installI18nFonts,
        measurementMode: parsed.measurementMode,
        onPhase: options.onCapturePhase,
      });

      const heroTile = capture.tiles[0];
      if (!heroTile) {
        throw new Error("Capture produced zero tiles.");
      }

      const fullPage = await stitchCaptureTiles(capture.tiles);
      return {
        status: "captured",
        hero: tileToArtifact(heroTile),
        fullPage,
        tiles: capture.tiles,
        documentHeight: capture.documentHeight,
        documentWidth: capture.documentWidth,
        viewport: capture.viewport,
        measurementMode: capture.measurementMode,
        installedI18nFonts: capture.installedI18nFonts,
        durationsMs: capture.durationsMs,
      };
    } catch (error) {
      lastError = error;
      options.onCapturePhase?.({
        phase: "attempt",
        status: "warn",
        detail: `attempt ${attempt}/${maxAttempts} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  return {
    status: "failed",
    attempts: maxAttempts,
    reason:
      lastError instanceof Error
        ? lastError.message
        : "Unknown Daytona capture error",
  };
}

export function summarizeVisual(result: VisualResult): Record<string, unknown> {
  if (result.status === "captured") {
    return {
      status: result.status,
      tiles: result.tiles.length,
      documentHeight: result.documentHeight,
      documentWidth: result.documentWidth,
      measurementMode: result.measurementMode,
      installedI18nFonts: result.installedI18nFonts,
      heroBytes: result.hero.sizeBytes ?? result.hero.imageBase64.length,
      fullPageBytes: result.fullPage.sizeBytes ?? result.fullPage.imageBase64.length,
      durations: result.durationsMs,
    };
  }
  if (result.status === "failed") {
    return {
      status: result.status,
      reason: result.reason,
      attempts: result.attempts,
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
      "Capture the full landing page of the URL inside a Daytona sandbox using Computer Use. Returns status: 'skipped' when no Daytona key is available, or 'failed' after retries when capture cannot complete.",
    inputSchema: visualInputSchema,
    execute: async (input) => {
      const result = await runVisual(input, options);
      sink.visual = result;
      return summarizeVisual(result);
    },
  });
}
