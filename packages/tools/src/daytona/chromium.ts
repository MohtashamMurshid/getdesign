import type { Sandbox } from "@daytonaio/sdk";

import type { CapturePhaseHandler, Viewport } from "./types";

export const CHROMIUM_WRAPPER_PATH = "/tmp/getdesign-chromium.sh";
export const CHROMIUM_LOG_PATH = "/tmp/chromium.log";
export const CHROMIUM_PROFILE_DIR = "/tmp/gd-chromium-profile";
export const CDP_PORT = 9222;

export type LaunchChromiumKioskOptions = {
  url: string;
  viewport: Viewport;
  display?: string;
  startupTimeoutMs?: number;
  onPhase?: CapturePhaseHandler;
};

export type LaunchChromiumKioskResult = {
  cdpAvailable: boolean;
  display: string;
};

/**
 * Render the wrapper script that launches Chromium 144+ in kiosk mode with
 * CDP bound to localhost. Note that Chromium 144+ requires
 * `--remote-allow-origins=*` for the WebSocket handshake to accept the
 * `http://127.0.0.1:9222` origin sent by our in-sandbox CDP probe.
 */
export function buildChromiumWrapperScript(viewport: Viewport): string {
  const w = Math.round(viewport.width);
  const h = Math.round(viewport.height);
  return [
    "#!/usr/bin/env bash",
    "set -e",
    `mkdir -p ${CHROMIUM_PROFILE_DIR}`,
    'export DISPLAY="${DISPLAY:-:0}"',
    "nohup chromium \\",
    "  --no-sandbox --disable-dev-shm-usage --disable-gpu \\",
    "  --no-first-run --no-default-browser-check \\",
    "  --disable-features=Translate,InterestCohort \\",
    "  --hide-scrollbars --force-color-profile=srgb \\",
    `  --user-data-dir=${CHROMIUM_PROFILE_DIR} \\`,
    `  --remote-debugging-address=127.0.0.1 --remote-debugging-port=${CDP_PORT} \\`,
    "  --remote-allow-origins=* \\",
    `  --kiosk --window-size=${w},${h} \\`,
    `  "$1" > ${CHROMIUM_LOG_PATH} 2>&1 &`,
    'echo "launched pid=$!"',
    "",
  ].join("\n");
}

function b64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

async function pollCdpReady(sandbox: Sandbox, deadline: number): Promise<boolean> {
  while (Date.now() < deadline) {
    try {
      const res = await sandbox.process.executeCommand(
        `curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:${CDP_PORT}/json/version 2>/dev/null || echo 000`,
      );
      if ((res.result ?? "").trim().endsWith("200")) return true;
    } catch {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/**
 * Launch Chromium in kiosk mode pointing at `url` inside the sandbox. Returns
 * once the CDP `/json/version` endpoint answers 200. Throws if neither
 * the CDP endpoint nor a kiosk window appears within `startupTimeoutMs`.
 *
 * Implementation note: `process.executeCommand` does NOT interpret `\n`
 * inside arg strings as newlines, so we ship the wrapper script via base64
 * decoded into a file. dbus errors from Chromium are non-fatal and are
 * intentionally not part of the success criterion.
 */
export async function launchChromiumKiosk(
  sandbox: Sandbox,
  options: LaunchChromiumKioskOptions,
): Promise<LaunchChromiumKioskResult> {
  const display = options.display ?? ":0";
  const timeoutMs = options.startupTimeoutMs ?? 20_000;
  const { onPhase, viewport, url } = options;

  onPhase?.({ phase: "chromium_launch", status: "start" });
  const startedAt = Date.now();

  // 1. Ship the wrapper script via base64 (avoids \n / quoting pitfalls).
  const wrapper = buildChromiumWrapperScript(viewport);
  const writeCmd = `echo ${b64(wrapper)} | base64 -d > ${CHROMIUM_WRAPPER_PATH} && chmod +x ${CHROMIUM_WRAPPER_PATH}`;
  const writeRes = await sandbox.process.executeCommand(writeCmd);
  if (writeRes.exitCode !== 0) {
    throw new Error(
      `Failed to write Chromium wrapper script: ${(writeRes.result ?? "").trim()}`,
    );
  }

  // 2. Launch (URL passed as $1 so any quoting stays bash-side).
  const launchCmd = `DISPLAY=${JSON.stringify(display).replace(/'/g, "'\\''")} ${CHROMIUM_WRAPPER_PATH} ${JSON.stringify(url)}`;
  const launchRes = await sandbox.process.executeCommand(launchCmd);
  if (launchRes.exitCode !== 0) {
    throw new Error(
      `Failed to launch Chromium: ${(launchRes.result ?? "").trim()}`,
    );
  }

  // 3. Wait until CDP answers — the only reliable success signal. Chromium
  //    emits dbus errors at startup that are NOT fatal, so we never look at
  //    stderr for failure.
  const deadline = Date.now() + timeoutMs;
  const cdpAvailable = await pollCdpReady(sandbox, deadline);

  if (!cdpAvailable) {
    let logTail = "";
    try {
      const tail = await sandbox.process.executeCommand(
        `tail -40 ${CHROMIUM_LOG_PATH} 2>&1 || true`,
      );
      logTail = (tail.result ?? "").trim().slice(0, 600);
    } catch {
      // ignore
    }
    throw new Error(
      `Chromium did not become ready within ${timeoutMs}ms (no CDP endpoint).${
        logTail ? ` Log tail: ${logTail}` : ""
      }`,
    );
  }

  onPhase?.({
    phase: "chromium_launch",
    status: "ok",
    detail: `cdp ready`,
    durationMs: Date.now() - startedAt,
  });

  return { cdpAvailable, display };
}
