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
} from "./chromium.js";
export type {
  LaunchChromiumKioskOptions,
  LaunchChromiumKioskResult,
} from "./chromium.js";

export {
  measurePageHeight,
  waitForReadyState,
} from "./measurement.js";

export { CaptureReadinessError, waitForCaptureReadiness } from "./readiness.js";
export type {
  MeasurementMode,
  MeasurementResult,
  MeasurePageHeightOptions,
} from "./measurement.js";

export {
  createCaptureSandbox,
  disposeCaptureSandbox,
  prepareCaptureSandbox,
  DEFAULT_VIEWPORT,
} from "./sandbox.js";
export type {
  CaptureSandbox,
  CaptureSandboxOptions,
  PrepareCaptureSandboxOptions,
} from "./sandbox.js";

export {
  ensureI18nFonts,
  shouldInstallI18nFonts,
} from "./fonts.js";
export type { EnsureI18nFontsOptions } from "./fonts.js";

export {
  captureFullPage,
  runCapture,
  stitchCaptureTiles,
} from "./capture.js";
export type {
  CaptureFullPageOptions,
  RunCaptureOptions,
} from "./capture.js";

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
} from "./types.js";
