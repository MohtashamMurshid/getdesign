/**
 * Public surface for the getdesign capture pipeline.
 *
 * The pipeline runs entirely on top of Daytona's hosted Computer Use HTTP
 * API plus an in-sandbox Chromium. There is no custom snapshot, no SSH
 * tunnel, and no host-side CDP client — see ADR 0002.
 */

export {
  buildChromiumWrapperScript,
  CDP_PORT,
  CHROMIUM_WRAPPER_PATH,
  launchChromiumKiosk,
} from "./chromium";
export type {
  LaunchChromiumKioskOptions,
  LaunchChromiumKioskResult,
} from "./chromium";

export {
  measurePageHeight,
  waitForReadyState,
} from "./measurement";
export type {
  MeasurementMode,
  MeasurementResult,
  MeasurePageHeightOptions,
} from "./measurement";

export {
  createCaptureSandbox,
  disposeCaptureSandbox,
  prepareCaptureSandbox,
  DEFAULT_VIEWPORT,
} from "./sandbox";
export type {
  CaptureSandbox,
  CaptureSandboxOptions,
  PrepareCaptureSandboxOptions,
} from "./sandbox";

export {
  ensureI18nFonts,
  shouldInstallI18nFonts,
} from "./fonts";
export type { EnsureI18nFontsOptions } from "./fonts";

export {
  captureFullPage,
  runCapture,
  stitchCaptureTiles,
} from "./capture";
export type {
  CaptureFullPageOptions,
  RunCaptureOptions,
} from "./capture";

export type {
  CaptureDurations,
  CaptureMeasurementMode,
  CapturePhaseEvent,
  CapturePhaseHandler,
  CapturePhaseStatus,
  CaptureResult,
  CaptureTile,
  ScreenshotArtifact,
  Viewport,
} from "./types";
