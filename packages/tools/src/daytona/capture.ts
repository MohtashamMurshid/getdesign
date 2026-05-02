import sharp from "sharp";

import { launchChromiumKiosk } from "./chromium";
import {
  measurePageHeight,
  waitForReadyState,
  type MeasurementMode,
} from "./measurement";
import {
  createCaptureSandbox,
  disposeCaptureSandbox,
  prepareCaptureSandbox,
  type CaptureSandbox,
  type CaptureSandboxOptions,
} from "./sandbox";
import { shouldInstallI18nFonts } from "./fonts";
import type {
  CapturePhaseHandler,
  CaptureResult,
  CaptureTile,
  ScreenshotArtifact,
  Viewport,
} from "./types";

export type CaptureFullPageOptions = {
  url: string;
  installI18nFonts?: boolean;
  maxScrolls?: number;
  stableScreenshots?: number;
  pixelDiffThreshold?: number;
  measurementMode?: MeasurementMode;
  onPhase?: CapturePhaseHandler;
};

export type RunCaptureOptions = CaptureSandboxOptions &
  CaptureFullPageOptions;

async function takeViewportTile(
  sandbox: CaptureSandbox,
  index: number,
  yOffset: number,
  viewport: Viewport,
): Promise<CaptureTile> {
  const shot = (await sandbox.computerUse.screenshot.takeCompressed({
    format: "png",
    showCursor: false,
  })) as { screenshot?: string; width?: number; height?: number };
  // Per Daytona Computer Use, the base64 PNG is at `.screenshot`. No legacy
  // aliases (image_base64 / imageBase64 / data / image) are populated.
  const b64 = shot.screenshot;
  if (!b64) throw new Error("Daytona screenshot response did not contain a `screenshot` field.");
  const data = Buffer.from(b64, "base64");
  let width = shot.width;
  let height = shot.height;
  if (!width || !height) {
    const meta = await sharp(data).metadata();
    width = meta.width ?? viewport.width;
    height = meta.height ?? viewport.height;
  }
  return {
    index,
    yOffset,
    width: width!,
    height: height!,
    pngBase64: b64,
  };
}

export async function captureFullPage(
  sandbox: CaptureSandbox,
  options: CaptureFullPageOptions,
): Promise<CaptureResult> {
  const onPhase = options.onPhase;
  const viewport = sandbox.__captureViewport;
  const start = Date.now();

  // chromium launch
  const chromiumStarted = Date.now();
  const launch = await launchChromiumKiosk(sandbox, {
    url: options.url,
    viewport,
    onPhase,
  });
  const chromiumLaunchDuration = Date.now() - chromiumStarted;

  // Wait until document.readyState === "complete" before any screenshot or
  // measurement — the first screenshot otherwise often returns blank
  // Chromium chrome (~19KB PNG).
  await waitForReadyState(sandbox, { onPhase });

  // measurement
  const measureStart = Date.now();
  const measurementMode = options.measurementMode ?? (launch.cdpAvailable ? "auto" : "visual");
  const measurement = await measurePageHeight(sandbox, {
    mode: measurementMode,
    viewport,
    maxScrolls: options.maxScrolls,
    stableScreenshots: options.stableScreenshots,
    pixelDiffThreshold: options.pixelDiffThreshold,
    onPhase,
  });
  const measureDuration = Date.now() - measureStart;

  // tile capture: produce ceil(documentHeight / viewport.height) tiles.
  const tilesStart = Date.now();
  onPhase?.({ phase: "tiles", status: "start", detail: `target=${measurement.height}px` });
  const tileCount = Math.max(1, Math.ceil(measurement.height / viewport.height));
  const tiles: CaptureTile[] = [];

  // Reset to top.
  await sandbox.computerUse.keyboard.press("Home", ["ctrl"]);
  await new Promise((r) => setTimeout(r, 300));

  for (let i = 0; i < tileCount; i += 1) {
    const yOffset = i * viewport.height;
    const tile = await takeViewportTile(sandbox, i, yOffset, viewport);
    tiles.push(tile);
    if (i < tileCount - 1) {
      await sandbox.computerUse.keyboard.press("Page_Down");
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  const tilesDuration = Date.now() - tilesStart;
  onPhase?.({
    phase: "tiles",
    status: "ok",
    detail: `${tiles.length} tiles`,
    durationMs: tilesDuration,
  });

  return {
    url: options.url,
    documentHeight: measurement.height,
    documentWidth: measurement.width,
    viewport,
    tiles,
    measurementMode: measurement.mode,
    installedI18nFonts: !!options.installI18nFonts,
    durationsMs: {
      sandboxCreate: 0,
      prepare: 0,
      chromiumLaunch: chromiumLaunchDuration,
      measure: measureDuration,
      tiles: tilesDuration,
      total: Date.now() - start,
    },
  };
}

/**
 * One-shot orchestrator: create sandbox -> prepare -> capture -> dispose.
 * Most callers (the visual agent, smoke scripts) want this. The lower-level
 * primitives are exposed for advanced reuse.
 */
export async function runCapture(options: RunCaptureOptions): Promise<CaptureResult> {
  const onPhase = options.onPhase;
  const installI18nFonts =
    options.installI18nFonts ?? shouldInstallI18nFonts(options.url);

  let sandbox: CaptureSandbox | null = null;
  const total = Date.now();
  try {
    onPhase?.({ phase: "sandbox_create", status: "start" });
    const sandboxStart = Date.now();
    sandbox = await createCaptureSandbox({
      daytonaApiKey: options.daytonaApiKey,
      autoStopInterval: options.autoStopInterval,
      autoArchiveInterval: options.autoArchiveInterval,
      autoDeleteInterval: options.autoDeleteInterval,
      viewport: options.viewport,
    });
    const sandboxCreateDuration = Date.now() - sandboxStart;
    onPhase?.({
      phase: "sandbox_create",
      status: "ok",
      durationMs: sandboxCreateDuration,
    });

    const prepareStart = Date.now();
    onPhase?.({ phase: "prepare", status: "start" });
    await prepareCaptureSandbox(sandbox, { installI18nFonts, onPhase });
    const prepareDuration = Date.now() - prepareStart;
    onPhase?.({ phase: "prepare", status: "ok", durationMs: prepareDuration });

    const result = await captureFullPage(sandbox, {
      ...options,
      installI18nFonts,
    });
    return {
      ...result,
      durationsMs: {
        ...result.durationsMs,
        sandboxCreate: sandboxCreateDuration,
        prepare: prepareDuration,
        total: Date.now() - total,
      },
    };
  } finally {
    await disposeCaptureSandbox(sandbox);
  }
}

/**
 * Stitch capture tiles into a single PNG. Used by callers that want a
 * stitched preview without re-implementing sharp composition.
 */
export async function stitchCaptureTiles(
  tiles: CaptureTile[],
): Promise<ScreenshotArtifact> {
  if (tiles.length === 0) throw new Error("stitchCaptureTiles: no tiles supplied.");
  const sorted = [...tiles].sort((a, b) => a.yOffset - b.yOffset);
  const width = sorted[0]!.width;
  const totalHeight = Math.max(
    ...sorted.map((tile) => tile.yOffset + tile.height),
  );
  const composite = sorted.map((tile) => ({
    input: Buffer.from(tile.pngBase64, "base64"),
    top: tile.yOffset,
    left: 0,
  }));
  const buffer = await sharp({
    create: {
      width,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composite)
    .png()
    .toBuffer();
  return {
    imageBase64: buffer.toString("base64"),
    width,
    height: totalHeight,
    format: "png",
    sizeBytes: buffer.byteLength,
  };
}
