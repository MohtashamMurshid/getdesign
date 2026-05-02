# ADR 0002: Capture control surface — Daytona Computer Use

## Status

Accepted (supersedes ADR 0002 "BYOK Daytona runtime provisioning" and ADR 0003 "CDP via SSH tunnel", both deleted).

## Context

ADR 0001 commits us to capturing the actual rendered landing page from top to document bottom inside a Daytona sandbox. The earlier plan paired that with two pieces of custom machinery:

- a versioned, GHCR-published OCI image plus a per-user `getdesign-capture-<runtimeVersion>` snapshot (former ADR 0002), and
- a host-side Chrome DevTools Protocol client driven over an SSH tunnel into the sandbox (former ADR 0003).

Both were designed before we measured what Daytona's hosted Computer Use environment already provides. A direct probe of a default sandbox showed:

- Debian 13 with Chromium 144 at `/usr/bin/chromium`, Xvfb, x11vnc, xfce4-session, dbus-launch, generous CPU/memory — sandbox creation in ~960 ms.
- `sandbox.computerUse.start()` brings Xvfb up on `:0` (not `:1` as our old wrapper assumed) and exposes screenshot, mouse, keyboard, and display HTTP APIs.
- 36 fonts, Latin-only (DejaVu + Liberation). No CJK, no emoji, no Inter/Roboto.

In other words, the desktop, browser, and screenshot/input control plane are already there. The only thing we genuinely need that the default sandbox doesn't give us is precise document-height measurement (Daytona scroll is wheel-tick based, not pixel) — and that one need is satisfied by the same Chromium we launch, on a localhost port, without leaving the sandbox.

## Decision

The capture control surface for getdesign is Daytona Computer Use plus an in-sandbox CDP probe. There is no custom snapshot, no GHCR image pipeline, no host-side CDP client, and no SSH tunnel.

- **Sandbox**: every run calls `daytona.create({ autoStopInterval, autoArchiveInterval, autoDeleteInterval })` against the user's BYOK Daytona key. Lifecycle is handled by Daytona's auto-stop / auto-archive / auto-delete intervals — short-lived, ephemeral, no manual cleanup.
- **Browser**: the agent process writes a small wrapper script (`/tmp/getdesign-chromium.sh`) into the sandbox and launches Chromium in kiosk mode with `--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222`. The CDP port is bound to localhost inside the sandbox; nothing exposes it externally.
- **Input + screenshots**: `sandbox.computerUse.screenshot.takeCompressed`, `sandbox.computerUse.keyboard.press` (Page_Down / Ctrl+Home for scroll), and `sandbox.computerUse.display.getWindows` are the canonical I/O.
- **Page measurement**: a tiny Python script run via `sandbox.process.executeCommand` discovers the active page target through `http://127.0.0.1:9222/json` and runs a single `Runtime.evaluate` over a websocket to read `document.documentElement.scrollHeight` / `scrollWidth` / `devicePixelRatio`. The script self-installs `websocket-client` via pip if it's missing. CDP stays inside the sandbox; the host never touches port 9222.
- **Visual-stability fallback**: if CDP measurement fails (browser not yet ready, missing target, Python quirk), the measurement layer scrolls the page with `Page_Down`, screenshots after each scroll, and stops when N consecutive frames are pixel-identical (or differ below a small threshold). Document height is approximated as `(scrolls + 1) × viewport.height`.
- **Tile capture**: scroll back to top, screenshot, `Page_Down`, screenshot, repeat. Tile count is `ceil(documentHeight / viewport.height)`. The list of tiles is the canonical capture artifact (ADR 0001) and a stitched preview is derived with `sharp` for UI/export.
- **i18n fonts**: opt-in. A TLD heuristic (`shouldInstallI18nFonts(url)`) flags hostnames ending in `.cn` / `.jp` / `.kr` / `.tw` / `.hk` / `.ru` / `.il` / `.sa` / `.ae` / `.in` and IDN/Punycode hosts; callers can override. When enabled, `fonts-noto-cjk` and `fonts-noto-color-emoji` are installed via `apt-get` (idempotent — probe with `fc-list :lang=zh` first). Default is Latin/Cyrillic/Greek only.
- **Retry contract**: unchanged from ADR 0001 — three total attempts, fresh sandbox each. The text-only fallback path remains the only escape hatch when capture cannot complete.

## Consequences

- ~70% less custom code: the Dockerfile, `runtime.ts` snapshot helpers, the host-side CDP client and JSON-RPC transport, and the SSH-tunnel TODO all go away.
- Cold-start matches the default sandbox (~1 s); first capture per fresh sandbox optionally adds ~30 s for the i18n font install when triggered.
- We rely on Daytona Computer Use being available and stable. If Daytona breaks the API, capture breaks. Mitigation: the visual-stability fallback covers measurement-only outages; broader Computer Use outages still surface as `capture_failed` with the standard text-only opt-in.
- International rendering coverage is opt-in for v1. Latin-script pages render with the default fonts; CJK / emoji content needs the explicit install. The TLD heuristic catches the obvious cases without paying the cost universally.
- CDP stays in-sandbox, behind localhost, and only for measurement. Screenshots and input remain on Daytona Computer Use.

## Alternatives considered

- **Custom snapshot via `Image.fromDockerfile` (former ADR 0002).** Rejected. Build/publish/version lifecycle complexity for marginal benefit over the default sandbox. Default sandbox already ships Chromium 144, Xvfb, xfce4, and the desktop helpers we previously baked in; the only thing it misses (CJK fonts) is a 30 s opt-in apt install.
- **Host-side CDP via SSH tunnel (former ADR 0003).** Rejected. `sandbox.computerUse.*` covers screenshots and input; CDP is only needed for precise measurement, and that runs cleanly inside the sandbox where Chromium already exposes 127.0.0.1:9222. Removing the tunnel removes a brittle, partly-stubbed dependency on `createSshAccess()` and `ssh -L`.
- **Headless `chromium --headless=new --screenshot` capture.** Rejected as the primary path (still acceptable as last-resort fallback per ADR 0001). Headless rendering can diverge from the desktop session and forecloses future interactive states.

## Implementation gotchas

Concrete issues surfaced by an end-to-end probe of Daytona Computer Use against `https://news.ycombinator.com` (reference impl at `packages/tools/probe-computer-use.ts`). Future maintainers debugging capture issues should verify each of these before guessing.

1. **Screenshot field name.** `sandbox.computerUse.screenshot.takeCompressed(...)` returns `{ screenshot: <base64-png>, sizeBytes: N }`. The base64 PNG is at the key `screenshot`. Older field aliases (`image_base64`, `imageBase64`, `data`, `image`) are NOT populated — assuming them silently breaks tile decoding.

2. **Chromium 144+ requires `--remote-allow-origins=*`.** Without it the in-sandbox CDP probe's WebSocket handshake fails with `403 Forbidden — Rejected an incoming WebSocket connection from the http://127.0.0.1:9222 origin`. The flag MUST appear alongside `--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222`.

3. **`process.executeCommand` does not interpret `\n` inside arg strings as newlines.** Heredocs and template-literal scripts get mangled (we observed `necho` and `truen` errors). Pattern that works: build the script as a string locally, base64-encode, then `echo <b64> | base64 -d > /tmp/script.{sh,py} && chmod +x ...`. Both `chromium.ts` and `measurement.ts` use this pattern.

4. **Display is locked at 1024×768.** `xrandr --size 1440x900` fails with "not found in available modes"; `display.getInfo()` returns `{displays:[{width:1024,height:768,isActive:true}]}`. v1 viewport defaults to 1024×768 to match the screen we screenshot. Restarting Xvfb at a different geometry is a future TODO.

5. **`websocket-client` install must be a separate `executeCommand`.** Same-process `pip install` followed by `import websocket` fails because Python caches negative module lookups. We therefore run `python3 -m pip install --quiet --user websocket-client` first, then run the probe script in a second `executeCommand`. The install is idempotent and skipped per-sandbox via a `WeakSet`.

6. **`computerUse.start()` takes ~9 seconds.** It is the largest fixed cost in the pipeline. TODO: parallelize with `apt-get install fonts-noto-cjk` (and any other prep work) when the i18n font path is requested. Not parallelized today; documented in `prepareCaptureSandbox`.

7. **Wait for `document.readyState === "complete"` before the first screenshot.** A tile taken before the page is ready returns ~19 KB of blank Chromium chrome. The capture flow polls `Runtime.evaluate({"expression": "document.readyState"})` via in-sandbox CDP until it returns `"complete"` (15 s timeout) before measurement and tile capture. The visual-stability fallback path additionally requires two consecutive identical screenshots at scroll y=0 before starting the scroll loop.

8. **Chromium emits dbus connection errors at startup.** Lines like `Failed to connect to socket /run/dbus/system_bus_socket` appear in `chromium.log` and are NON-FATAL. Launch-success detection looks at the CDP `/json/version` HTTP 200 response, never at the absence of stderr text.

9. **In-sandbox CDP measurement, exact contract.** HTTP discovery: `http://127.0.0.1:9222/json` returns a list of pages; the WebSocket URL comes from `webSocketDebuggerUrl` on the first `type: "page"` entry. The canonical measurement expression is `JSON.stringify({sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight, vw:innerWidth, vh:innerHeight, dpr:devicePixelRatio, title:document.title, ready:document.readyState})` and returns a JSON object on the WebSocket response's `result.result.value` field.

## References

- [ADR 0001](0001-full-landing-page-capture.md) — capture strategy (still authoritative).
- Daytona Computer Use docs — `sandbox.computerUse.{screenshot,keyboard,mouse,display}`, `sandbox.process.executeCommand`.
- `packages/tools/src/daytona/` — `sandbox.ts`, `chromium.ts`, `measurement.ts`, `capture.ts`, `fonts.ts`.
- `packages/tools/probe-computer-use.ts` — working end-to-end reference for the gotchas above.
