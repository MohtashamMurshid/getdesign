import { Daytona, type Sandbox } from "@daytonaio/sdk";

import { ensureI18nFonts } from "./fonts";
import type { CapturePhaseHandler, Viewport } from "./types";

/**
 * Daytona's default Xvfb display is locked to 1024×768 and `xrandr --size`
 * reports the target as "not in available modes". Until we restart Xvfb at
 * a different geometry (TODO), the capture viewport must match the screen
 * we screenshot, otherwise tiles and the kiosk window disagree.
 */
export const DEFAULT_VIEWPORT: Viewport = { width: 1024, height: 768 };

export type CaptureSandboxOptions = {
  daytonaApiKey: string;
  autoStopInterval?: number;
  autoArchiveInterval?: number;
  autoDeleteInterval?: number;
  viewport?: Viewport;
};

export type PrepareCaptureSandboxOptions = {
  installI18nFonts?: boolean;
  onPhase?: CapturePhaseHandler;
};

export type CaptureSandbox = Sandbox & {
  /** Viewport this sandbox was created for. Used by callers to size Chromium and tiles. */
  __captureViewport: Viewport;
};

function attachViewport(sandbox: Sandbox, viewport: Viewport): CaptureSandbox {
  (sandbox as CaptureSandbox).__captureViewport = viewport;
  return sandbox as CaptureSandbox;
}

export async function createCaptureSandbox(
  options: CaptureSandboxOptions,
): Promise<CaptureSandbox> {
  if (!options.daytonaApiKey?.trim()) {
    throw new Error("createCaptureSandbox: daytonaApiKey is required.");
  }

  const client = new Daytona({ apiKey: options.daytonaApiKey });
  const sandbox = await client.create({
    autoStopInterval: options.autoStopInterval ?? 5,
    autoArchiveInterval: options.autoArchiveInterval ?? 5,
    autoDeleteInterval: options.autoDeleteInterval ?? 1,
  });
  return attachViewport(sandbox, options.viewport ?? DEFAULT_VIEWPORT);
}

export async function prepareCaptureSandbox(
  sandbox: CaptureSandbox,
  options: PrepareCaptureSandboxOptions = {},
): Promise<void> {
  // TODO(perf): `computerUse.start()` takes ~9s — the single largest fixed
  // cost in the pipeline. When `installI18nFonts` is requested we could
  // run apt-get in parallel with computerUse.start; today we do them
  // sequentially for simplicity. See ADR 0002 gotcha #6.
  await sandbox.computerUse.start();

  if (options.installI18nFonts) {
    await ensureI18nFonts(sandbox, { onPhase: options.onPhase });
  }
}

export async function disposeCaptureSandbox(
  sandbox: CaptureSandbox | null | undefined,
): Promise<void> {
  if (!sandbox) return;
  try {
    await sandbox.delete();
  } catch {
    // best-effort teardown; sandbox may already be auto-deleted
  }
}
