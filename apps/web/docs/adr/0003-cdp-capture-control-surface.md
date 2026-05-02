# ADR 0003: Chrome DevTools Protocol as the capture control surface

## Status

Accepted

## Context

Full landing page capture (ADR 0001) needs deterministic measurement of the rendered document height, pixel-precise scroll-to-offset, overlay cleanup, and fixed-element deduplication. Daytona's `computerUse.mouse.scroll` works in wheel ticks, not pixels, and `xdotool` keystroke injection has no clean return-value channel — neither is suitable as the source of truth for tile-based capture.

The capture-runtime image and `ensureDaytonaCaptureSnapshot` (ADR 0002) give every BYOK user a deterministic Daytona runtime, so we can rely on Chromium being available with consistent flags. We need a typed control channel that is separate from the screenshot channel and that can be driven from the host agent process.

## Decision

Use Chrome DevTools Protocol (CDP) as the capture control surface.

- Chromium runs inside the Daytona sandbox via the `getdesign-chromium` wrapper, which binds CDP to `127.0.0.1:9222` (`--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222`). The port is localhost-only inside the sandbox; there is no `EXPOSE 9222` and no public Daytona preview link.
- The host agent process opens an SSH tunnel to the sandbox via the Daytona TS SDK (`createSshAccess()`), forwarding remote `127.0.0.1:9222` to an ephemeral local port.
- Capture control runs from the host: `Runtime.evaluate` for measurement and scroll, `Page.addStyleSheet` (or `Runtime.evaluate`-injected `<style>` tags) for overlay cleanup and fixed-element dedup.
- Screenshots remain on `sandbox.computerUse.screenshot.takeCompressed()`. CDP is **not** used for capture — the two surfaces are intentionally separate so we keep Daytona as the rendering/screenshot environment and CDP as the typed control plane.
- Kiosk mode at the call site is mandatory so Daytona screenshots do not catch window chrome.
- Daytona owns the desktop via `computerUse.start()`. The capture-runtime image does not run a self-managed Xvfb.

## Consequences

- One control protocol, deterministic. Measurement and scroll are the same shape regardless of site quirks.
- Adds an SSH-tunnel dependency on the Daytona SDK. The SDK exposes `createSshAccess()` but not a programmatic port-forward primitive, so the host-side tunnel must drive `ssh -L` (or an in-process SSH client). Until that lands, `packages/tools/src/daytona/cdp.ts` ships the wire-protocol layer with a documented `TODO(cdp-tunnel)` stub for the tunnel layer; the rest of `runVisual` does not depend on CDP for the v1 ship.
- Splits the screenshot system from the control system on purpose. Future interactive states still use Daytona's mouse/keyboard APIs; we are not building a second renderer.
- The `getdesign-chromium` wrapper is now load-bearing — the CDP flags, kiosk-friendly defaults, and `127.0.0.1` binding all live there. `daytonaOpenUrlCommand` defaults `chromiumBinary` to `getdesign-chromium`.

## Alternatives considered

- **xdotool + injected `javascript:` URLs.** No clean return-value channel for measurement, no typed scroll, brittle around overlays.
- **CDP via a Daytona preview link with a token.** Would require `--remote-debugging-address=0.0.0.0`. That flag's behavior has changed across Chromium versions and broadens the attack surface; localhost-only binding plus an SSH tunnel keeps the runtime identical to a developer's local dev tools session.
- **CDP client running in-sandbox.** Would couple the snapshot image to `packages/tools` code, making every capture-pipeline change a snapshot rebuild. Keeping the client on the host means most pipeline iteration is a code-only change.
