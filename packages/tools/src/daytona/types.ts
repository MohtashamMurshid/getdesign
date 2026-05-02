/**
 * Shared types for the getdesign capture pipeline.
 *
 * The capture pipeline runs entirely on top of Daytona's hosted Computer Use
 * HTTP API plus an in-sandbox Chromium. There is no custom Daytona snapshot,
 * no SSH tunnel, and no host-side CDP client; see ADR 0002.
 */

export type Viewport = {
  width: number;
  height: number;
};

export type ScreenshotArtifact = {
  imageBase64: string;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
};

export type CapturePhaseStatus = "start" | "ok" | "warn" | "error";

export type CapturePhaseEvent = {
  phase: string;
  status: CapturePhaseStatus;
  detail?: string;
  durationMs?: number;
};

export type CapturePhaseHandler = (event: CapturePhaseEvent) => void;

export type CaptureMeasurementMode = "cdp" | "visual";

export type CaptureTile = {
  index: number;
  yOffset: number;
  width: number;
  height: number;
  pngBase64: string;
};

export type CaptureDurations = {
  sandboxCreate: number;
  prepare: number;
  chromiumLaunch: number;
  measure: number;
  tiles: number;
  total: number;
};

export type CaptureResult = {
  url: string;
  documentHeight: number;
  documentWidth: number;
  viewport: Viewport;
  tiles: CaptureTile[];
  measurementMode: CaptureMeasurementMode;
  installedI18nFonts: boolean;
  durationsMs: CaptureDurations;
};
