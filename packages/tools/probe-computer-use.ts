/**
 * Probe Daytona Computer Use end-to-end against a real URL.
 *
 *   bun run packages/tools/probe-computer-use.ts [url]
 *
 * Exercises:
 *   - sandbox create with auto-cleanup lifecycle
 *   - computerUse.start
 *   - display.getInfo
 *   - kiosk Chromium launch via process.executeCommand
 *   - in-sandbox CDP probe for scrollHeight (python ws)
 *   - screenshot.takeCompressed (full + region)
 *   - keyboard.press("End") + screenshot again
 *   - writes captured screenshots to /tmp/getdesign-probe-cu/
 *
 * Reads DAYTONA_API_KEY from .env.local at repo root.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Daytona } from "@daytonaio/sdk";

const URL_ARG = process.argv[2] ?? "https://example.com";
// Daytona Xvfb is locked to 1024x768 by default — use that to keep Chromium's
// kiosk window matching the screen we'll screenshot. Refactor will need to
// either accept this or restart Xvfb at a different size (open question).
const VIEWPORT = { width: 1024, height: 768 };
const OUT_DIR = "/tmp/getdesign-probe-cu";

function loadEnv() {
  const envPath = resolve(import.meta.dir, "../../.env.local");
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnv();
  const apiKey = process.env.DAYTONA_API_KEY;
  if (!apiKey) throw new Error("DAYTONA_API_KEY missing in .env.local");

  mkdirSync(OUT_DIR, { recursive: true });

  const client = new Daytona({ apiKey });

  const tStart = Date.now();
  console.log(`[probe-cu] target url: ${URL_ARG}`);
  console.log("[probe-cu] creating sandbox…");
  const sandbox = await client.create({
    autoStopInterval: 5,
    autoArchiveInterval: 5,
    autoDeleteInterval: 1,
  });
  console.log(`[probe-cu] sandbox ${sandbox.id} created in ${Date.now() - tStart}ms`);

  const exec = async (cmd: string, label?: string) => {
    if (label) console.log(`\n--- ${label} ---\n$ ${cmd.slice(0, 200)}`);
    const res = await sandbox.process.executeCommand(cmd);
    const out =
      (res as any).result ??
      (res as any).output ??
      (res as any).stdout ??
      JSON.stringify(res);
    if (label) console.log(String(out).trim().slice(0, 1500));
    return String(out);
  };

  try {
    console.log("\n[probe-cu] starting computer use…");
    const t0 = Date.now();
    const cuStart = await sandbox.computerUse.start();
    console.log(
      `[probe-cu] computerUse.start ok in ${Date.now() - t0}ms:`,
      JSON.stringify(cuStart).slice(0, 200),
    );

    console.log("\n[probe-cu] display info…");
    const display = await sandbox.computerUse.display.getInfo();
    console.log(JSON.stringify(display, null, 2));

    // Resize Xvfb to the target viewport — most Daytona sandboxes start :0 at 1024x768.
    // We use xrandr if available, else restart Xvfb at the target size.
    console.log("\n[probe-cu] attempting display resize via xrandr…");
    await exec(
      `DISPLAY=:0 xrandr --size ${VIEWPORT.width}x${VIEWPORT.height} 2>&1 || ` +
        `xdpyinfo -display :0 2>&1 | grep dimensions || true`,
      "xrandr/xdpyinfo",
    );

    console.log("\n[probe-cu] launching chromium kiosk via tmp script…");
    // Write the launch script to a file inside the sandbox to avoid
    // bash-string-escaping pitfalls.
    const launchScript = [
      "#!/usr/bin/env bash",
      "set -e",
      "mkdir -p /tmp/gd-chromium-profile",
      `export DISPLAY=:0`,
      `nohup chromium \\`,
      `  --no-sandbox --disable-dev-shm-usage --disable-gpu \\`,
      `  --no-first-run --no-default-browser-check \\`,
      `  --disable-features=Translate,InterestCohort \\`,
      `  --hide-scrollbars --force-color-profile=srgb \\`,
      `  --user-data-dir=/tmp/gd-chromium-profile \\`,
      `  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \\`,
      `  --remote-allow-origins=* \\`,
      `  --kiosk --window-size=${VIEWPORT.width},${VIEWPORT.height} \\`,
      `  ${JSON.stringify(URL_ARG)} > /tmp/chromium.log 2>&1 &`,
      `echo "launched pid=$!"`,
    ].join("\n");
    // Use base64 to ship the script body cleanly through executeCommand.
    const b64Script = Buffer.from(launchScript, "utf8").toString("base64");
    await exec(
      `echo ${b64Script} | base64 -d > /tmp/launch.sh && chmod +x /tmp/launch.sh && /tmp/launch.sh && sleep 1 && head -5 /tmp/chromium.log 2>/dev/null || true`,
      "chromium launch",
    );

    console.log("\n[probe-cu] waiting for CDP (gentle polling, no X traffic)…");
    let cdpReady = false;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const cdpProbe = await exec(
        `curl -fsS -o /dev/null -w "%{http_code}" http://127.0.0.1:9222/json/version 2>/dev/null || echo 000`,
      );
      if (cdpProbe.trim().endsWith("200")) {
        cdpReady = true;
        console.log(`[probe-cu] CDP ready @ ${(i + 1) * 1000}ms`);
        break;
      }
    }
    console.log(`[probe-cu] cdpReady=${cdpReady}`);
    if (!cdpReady) {
      const log = await exec(`tail -40 /tmp/chromium.log 2>&1 || true`, "chromium.log tail");
      console.log("[probe-cu] chromium log tail above");
    }

    if (cdpReady) {
      console.log("\n[probe-cu] ensuring python websocket-client…");
      await exec(
        `python3 -m pip install --quiet --user websocket-client 2>&1 | tail -3 || true`,
      );

      console.log("\n[probe-cu] in-sandbox CDP: wait readyState + measure…");
      const pyScript = [
        "import json, sys, time, urllib.request, websocket",
        "",
        'def get_ws_url():',
        '    with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=5) as r:',
        "        pages = json.load(r)",
        '    page = next((p for p in pages if p.get("type") == "page"), None)',
        '    return page and page["webSocketDebuggerUrl"]',
        "",
        "url = get_ws_url()",
        "if not url:",
        '    print(json.dumps({"error": "no page"})); sys.exit(0)',
        "ws = websocket.create_connection(url, timeout=10)",
        "_id = [0]",
        "def call(method, params=None):",
        "    _id[0] += 1",
        '    ws.send(json.dumps({"id": _id[0], "method": method, "params": params or {}}))',
        "    while True:",
        "        resp = json.loads(ws.recv())",
        '        if resp.get("id") == _id[0]:',
        "            return resp",
        "",
        "deadline = time.time() + 15",
        "while time.time() < deadline:",
        '    r = call("Runtime.evaluate", {"expression": "document.readyState", "returnByValue": True})',
        '    if r["result"]["result"]["value"] == "complete":',
        "        break",
        "    time.sleep(0.25)",
        "",
        'expr = "JSON.stringify({sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight, vw:innerWidth, vh:innerHeight, dpr:devicePixelRatio, title:document.title, ready:document.readyState})"',
        'r = call("Runtime.evaluate", {"expression": expr, "returnByValue": True})',
        'print(r["result"]["result"]["value"])',
        "ws.close()",
      ].join("\n");
      const b64Py = Buffer.from(pyScript, "utf8").toString("base64");
      const pyOut = await exec(
        `echo ${b64Py} | base64 -d > /tmp/probe.py && python3 /tmp/probe.py 2>&1`,
        "cdp measurement",
      );
      console.log("[probe-cu] cdp result:", pyOut.trim().split("\n").slice(-1)[0]);
    } else {
      console.log("[probe-cu] CDP not reachable — would fall back to visual stability.");
    }

    console.log("\n[probe-cu] taking full-screen screenshot (compressed PNG)…");
    const t1 = Date.now();
    const shot = await sandbox.computerUse.screenshot.takeCompressed({
      format: "png",
      showCursor: false,
    });
    console.log(
      `[probe-cu] screenshot in ${Date.now() - t1}ms, keys:`,
      Object.keys(shot as any),
    );
    const extractPng = (s: any): Buffer | null => {
      const b64 =
        s.screenshot ?? s.image_base64 ?? s.imageBase64 ?? s.data ?? s.image;
      return b64 ? Buffer.from(b64, "base64") : null;
    };

    const shotAny = shot as any;
    const buf1 = extractPng(shotAny);
    if (buf1) {
      const p = `${OUT_DIR}/01-initial.png`;
      writeFileSync(p, buf1);
      console.log(`[probe-cu] wrote ${p} (${buf1.length} bytes, sizeBytes=${shotAny.sizeBytes})`);
    } else {
      console.log("[probe-cu] no image bytes — keys:", Object.keys(shotAny));
    }

    console.log("\n[probe-cu] keyboard press End → screenshot again…");
    try {
      await sandbox.computerUse.keyboard.press("end");
    } catch (e) {
      console.log("[probe-cu] keyboard.press error:", (e as Error).message);
    }
    await sleep(800);
    const shot2 = await sandbox.computerUse.screenshot.takeCompressed({ format: "png" });
    const buf2 = extractPng(shot2 as any);
    if (buf2) {
      writeFileSync(`${OUT_DIR}/02-after-end.png`, buf2);
      console.log(`[probe-cu] wrote 02-after-end.png (${buf2.length} bytes)`);
      const identical = buf1 && buf1.equals(buf2);
      console.log(`[probe-cu] visual-stability check: identical-to-initial=${identical}`);
    }

    console.log("\n[probe-cu] DONE.");
    console.log(`[probe-cu] outputs in ${OUT_DIR}`);
    console.log(`[probe-cu] total elapsed: ${Date.now() - tStart}ms`);
  } finally {
    console.log("\n[probe-cu] disposing sandbox…");
    try {
      await client.delete(sandbox);
      console.log("[probe-cu] sandbox deleted.");
    } catch (e) {
      console.log("[probe-cu] delete failed (will auto-cleanup):", (e as Error).message);
    }
  }
}

main().catch((e) => {
  console.error("[probe-cu] fatal:", e);
  process.exit(1);
});
