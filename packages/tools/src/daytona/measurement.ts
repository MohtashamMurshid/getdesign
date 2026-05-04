import type { Sandbox } from "@daytonaio/sdk";
import sharp from "sharp";

import type {
  CaptureMeasurementMode,
  CapturePhaseHandler,
  Viewport,
} from "./types.js";

export type MeasurementMode = CaptureMeasurementMode | "auto";

export type MeasurementResult = {
  width: number;
  height: number;
  dpr: number;
  mode: CaptureMeasurementMode;
  title?: string;
};

export type MeasurePageHeightOptions = {
  mode?: MeasurementMode;
  viewport: Viewport;
  /** Visual-stability cap (frames). */
  maxScrolls?: number;
  /** N consecutive identical (or sub-threshold) frames marks "stable". */
  stableScreenshots?: number;
  /** 0..1 fraction of bytes that may differ. */
  pixelDiffThreshold?: number;
  /** How long to wait for `document.readyState === "complete"`. */
  readyStateTimeoutMs?: number;
  onPhase?: CapturePhaseHandler;
};

function b64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

/**
 * Python script that polls `Runtime.evaluate({document.readyState})` until
 * it returns "complete" and then prints a JSON line with measurement data.
 *
 * Returns one JSON object on the last stdout line:
 *   {"sw":1024,"sh":1213,"vw":1024,"vh":768,"dpr":1,"title":"…","ready":"complete"}
 *
 * The script assumes `websocket-client` is already installed; we install
 * it in a separate `process.executeCommand` call before this script ever
 * runs because Python caches negative module lookups within a process.
 */
function buildCdpProbeScript(readyStateTimeoutMs: number): string {
  return [
    "import json, sys, time, urllib.request, websocket",
    "",
    "def get_ws_url():",
    '    with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=5) as r:',
    "        pages = json.load(r)",
    '    page = next((p for p in pages if p.get("type") == "page"), None)',
    '    return page and page.get("webSocketDebuggerUrl")',
    "",
    "url = get_ws_url()",
    "if not url:",
    '    print(json.dumps({"error": "no_page"}))',
    "    sys.exit(0)",
    "",
    "ws = websocket.create_connection(url, timeout=10)",
    "_id = [0]",
    "",
    "def call(method, params=None):",
    "    _id[0] += 1",
    '    ws.send(json.dumps({"id": _id[0], "method": method, "params": params or {}}))',
    "    while True:",
    "        resp = json.loads(ws.recv())",
    '        if resp.get("id") == _id[0]:',
    "            return resp",
    "",
    `deadline = time.time() + ${(readyStateTimeoutMs / 1000).toFixed(1)}`,
    "ready_observed = False",
    "while time.time() < deadline:",
    '    r = call("Runtime.evaluate", {"expression": "document.readyState", "returnByValue": True})',
    '    state = (r.get("result") or {}).get("result", {}).get("value")',
    '    if state == "complete":',
    "        ready_observed = True",
    "        break",
    "    time.sleep(0.25)",
    "",
    'expr = "JSON.stringify({sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight, vw:innerWidth, vh:innerHeight, dpr:devicePixelRatio, title:document.title, ready:document.readyState})"',
    'r = call("Runtime.evaluate", {"expression": expr, "returnByValue": True})',
    "ws.close()",
    'value = (r.get("result") or {}).get("result", {}).get("value")',
    "if not value:",
    '    print(json.dumps({"error": "no_value", "raw": r}))',
    "    sys.exit(0)",
    "print(value)",
    "",
  ].join("\n");
}

let websocketClientInstalled = new WeakSet<object>();

/**
 * Idempotently install `websocket-client` inside the sandbox. Per the probe
 * findings, this MUST run as its own `executeCommand`; importing the module
 * in the same Python process that triggered the install fails because
 * Python caches negative module lookups.
 */
async function ensureWebsocketClient(sandbox: Sandbox): Promise<void> {
  if (websocketClientInstalled.has(sandbox as object)) return;
  await sandbox.process.executeCommand(
    "python3 -m pip install --quiet --user websocket-client 2>&1 | tail -3 || true",
  );
  websocketClientInstalled.add(sandbox as object);
}

async function measureViaCdp(
  sandbox: Sandbox,
  options: MeasurePageHeightOptions,
): Promise<MeasurementResult | null> {
  const { onPhase } = options;
  onPhase?.({ phase: "measure_cdp", status: "start" });
  const startedAt = Date.now();

  try {
    await ensureWebsocketClient(sandbox);
  } catch (error) {
    onPhase?.({
      phase: "measure_cdp",
      status: "warn",
      detail: `pip install failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    return null;
  }

  const script = buildCdpProbeScript(options.readyStateTimeoutMs ?? 15_000);
  const cmd = `echo ${b64(script)} | base64 -d > /tmp/getdesign-cdp-probe.py && python3 /tmp/getdesign-cdp-probe.py 2>&1`;

  let res: { exitCode?: number; result?: string };
  try {
    res = await sandbox.process.executeCommand(cmd, undefined, undefined, 60);
  } catch (error) {
    onPhase?.({
      phase: "measure_cdp",
      status: "warn",
      detail: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
    return null;
  }

  const stdout = (res.result ?? "").trim();
  const lastLine = stdout.split(/\r?\n/).filter(Boolean).at(-1) ?? "";
  let parsed: {
    sw?: number;
    sh?: number;
    vw?: number;
    vh?: number;
    dpr?: number;
    title?: string;
    ready?: string;
    error?: string;
  };
  try {
    parsed = JSON.parse(lastLine);
  } catch {
    onPhase?.({
      phase: "measure_cdp",
      status: "warn",
      detail: `non-json output: ${stdout.slice(0, 200)}`,
      durationMs: Date.now() - startedAt,
    });
    return null;
  }

  if (parsed.error || typeof parsed.sh !== "number" || typeof parsed.sw !== "number") {
    onPhase?.({
      phase: "measure_cdp",
      status: "warn",
      detail: parsed.error ?? `invalid response: ${lastLine.slice(0, 200)}`,
      durationMs: Date.now() - startedAt,
    });
    return null;
  }

  const result: MeasurementResult = {
    width: parsed.sw,
    height: parsed.sh,
    dpr: typeof parsed.dpr === "number" && parsed.dpr > 0 ? parsed.dpr : 1,
    mode: "cdp",
    title: parsed.title,
  };
  onPhase?.({
    phase: "measure_cdp",
    status: "ok",
    detail: `${result.width}x${result.height}@${result.dpr}${
      parsed.title ? ` "${parsed.title}"` : ""
    }`,
    durationMs: Date.now() - startedAt,
  });
  return result;
}

async function takeViewportPng(
  sandbox: Sandbox,
): Promise<{ data: Buffer; width: number; height: number }> {
  const shot = (await sandbox.computerUse.screenshot.takeCompressed({
    format: "png",
    showCursor: false,
  })) as { screenshot?: string; width?: number; height?: number };
  // Per probe: the SDK puts the base64 PNG at `.screenshot`. Older field
  // aliases (`image_base64`, `imageBase64`, `data`, `image`) do not appear.
  const b = shot.screenshot;
  if (!b) throw new Error("Daytona screenshot response did not contain a `screenshot` field.");
  const data = Buffer.from(b, "base64");
  let width = shot.width;
  let height = shot.height;
  if (!width || !height) {
    const meta = await sharp(data).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  }
  return { data, width, height };
}

function diffRatio(a: Buffer, b: Buffer): number {
  if (a.length !== b.length) return 1;
  const len = a.length;
  if (len === 0) return 0;
  let diff = 0;
  for (let i = 0; i < len; i += 1) {
    if (a[i] !== b[i]) diff += 1;
  }
  return diff / len;
}

/**
 * Visual-stability fallback. Waits until 2 consecutive screenshots taken
 * before any scrolling are pixel-identical (page settled), then scrolls
 * with Page_Down + screenshots until the same stability criterion holds
 * at the bottom. Document height is approximated as `(scrolls + 1) ×
 * viewport.height`.
 */
async function measureViaVisualStability(
  sandbox: Sandbox,
  options: MeasurePageHeightOptions,
): Promise<MeasurementResult> {
  const { onPhase, viewport } = options;
  const stableTarget = options.stableScreenshots ?? 2;
  const maxScrolls = options.maxScrolls ?? 60;
  const threshold = options.pixelDiffThreshold ?? 0.001;

  onPhase?.({ phase: "measure_visual", status: "start" });
  const startedAt = Date.now();

  // Reset to top so the walk is deterministic.
  await sandbox.computerUse.keyboard.press("Home", ["ctrl"]);
  await new Promise((r) => setTimeout(r, 400));

  // Wait for the page to be visually settled at y=0 before scrolling — the
  // first screenshot is often blank Chromium chrome.
  let prev = await takeViewportPng(sandbox);
  for (let i = 0; i < 20; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    const next = await takeViewportPng(sandbox);
    if (diffRatio(prev.data, next.data) <= threshold) {
      prev = next;
      break;
    }
    prev = next;
  }

  let stableHits = 0;
  let scrolls = 0;

  while (scrolls < maxScrolls) {
    await sandbox.computerUse.keyboard.press("Page_Down");
    scrolls += 1;
    await new Promise((r) => setTimeout(r, 500));
    const next = await takeViewportPng(sandbox);
    const ratio = diffRatio(prev.data, next.data);
    if (ratio <= threshold) {
      stableHits += 1;
      if (stableHits >= stableTarget - 1) break;
    } else {
      stableHits = 0;
    }
    prev = next;
  }

  const result: MeasurementResult = {
    width: prev.width || viewport.width,
    height: (scrolls + 1) * viewport.height,
    dpr: 1,
    mode: "visual",
  };

  await sandbox.computerUse.keyboard.press("Home", ["ctrl"]);
  await new Promise((r) => setTimeout(r, 300));

  onPhase?.({
    phase: "measure_visual",
    status: "ok",
    detail: `~${result.height}px after ${scrolls} scrolls`,
    durationMs: Date.now() - startedAt,
  });
  return result;
}

export async function measurePageHeight(
  sandbox: Sandbox,
  options: MeasurePageHeightOptions,
): Promise<MeasurementResult> {
  const mode = options.mode ?? "auto";
  if (mode === "cdp" || mode === "auto") {
    const cdp = await measureViaCdp(sandbox, options);
    if (cdp) return cdp;
    if (mode === "cdp") {
      throw new Error("CDP measurement failed and mode='cdp' forbids fallback.");
    }
    options.onPhase?.({
      phase: "measure_cdp",
      status: "warn",
      detail: "falling back to visual stability",
    });
  }
  return measureViaVisualStability(sandbox, options);
}

/**
 * Block until `document.readyState === "complete"` or the timeout elapses.
 * Used to gate the first tile screenshot so we don't snapshot blank
 * Chromium chrome.
 */
export async function waitForReadyState(
  sandbox: Sandbox,
  options: { timeoutMs?: number; onPhase?: CapturePhaseHandler } = {},
): Promise<"complete" | "timeout" | "skipped"> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  options.onPhase?.({ phase: "ready_state", status: "start" });
  const startedAt = Date.now();
  try {
    await ensureWebsocketClient(sandbox);
  } catch {
    options.onPhase?.({
      phase: "ready_state",
      status: "warn",
      detail: "websocket-client unavailable",
    });
    return "skipped";
  }

  const script = buildCdpProbeScript(timeoutMs);
  const cmd = `echo ${b64(script)} | base64 -d > /tmp/getdesign-cdp-ready.py && python3 /tmp/getdesign-cdp-ready.py 2>&1`;
  const res = await sandbox.process.executeCommand(cmd, undefined, undefined, 60);
  const stdout = (res.result ?? "").trim();
  const lastLine = stdout.split(/\r?\n/).filter(Boolean).at(-1) ?? "";
  try {
    const parsed = JSON.parse(lastLine) as { ready?: string; error?: string };
    if (parsed.ready === "complete") {
      options.onPhase?.({
        phase: "ready_state",
        status: "ok",
        durationMs: Date.now() - startedAt,
      });
      return "complete";
    }
    options.onPhase?.({
      phase: "ready_state",
      status: "warn",
      detail: parsed.error ?? `ready=${parsed.ready ?? "?"}`,
      durationMs: Date.now() - startedAt,
    });
    return "timeout";
  } catch {
    options.onPhase?.({
      phase: "ready_state",
      status: "warn",
      detail: `unparseable: ${stdout.slice(0, 200)}`,
      durationMs: Date.now() - startedAt,
    });
    return "timeout";
  }
}
