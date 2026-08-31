# @getdesign/tools

Capture, crawl, extract, and render utilities for getdesign.

This package powers the getdesign agent runtime: static crawling, Daytona
Computer Use full-page capture, design token extraction, and deterministic
`design.md` rendering. Most users should install `@getdesign/sdk` or
`@getdesign/cli` instead.

## Capture readiness

Capture checks visible content before measuring or taking tiles. A read-only
in-sandbox CDP probe measures loading indicators, covering layers, controls, and
page geometry. Input and screenshots stay on Daytona Computer Use, as required
by ADR 0002. There is no CDP input, DOM mutation, host-side CDP, or overlay hiding.

- The readiness budget is 20 seconds by default. `readinessTimeoutMs` on
  `runCapture`/`captureFullPage` can lower it or raise it up to 30 seconds.
  Setup and transport calls share this budget. Polls are 500ms apart, with a
  hard cap of 60 polls and 10,000 inspected DOM elements.
- Two matching observations of visible content are required. Recognized loaders
  and blank pages wait within the budget, then fail if they persist.
- One click per attempt is allowed only on a stable, enabled button in a
  full-viewport intro layer. It must have an explicit label such as "Enter site",
  "Click to enter", or "Start experience", be the only control, and pass hit
  testing. CSS coordinates must match the Computer Use display at DPR 1.
- Login, account, consent, age, payment, verification, and other protected
  controls are never clicked. Ambiguous gates fail without interaction. Ordinary
  Enter/Start CTAs, hidden loaders, and small cookie banners are not intro gates.
- After height measurement and resetting to the top, one extra read-only check
  has a five-second limit. A late gate stops tiling without another click.
- Readiness failure throws `CaptureReadinessError` with `capture_not_ready` and
  actionable guidance. `runCapture` still disposes its sandbox in `finally`.
  The agent's existing `runVisual` loop owns the three fresh-sandbox attempts.
  A final required-capture failure becomes `capture_failed`; it does not generate
  a design for the gate or opt the user into text-only output.

If the readiness probe is unavailable, capture fails. Identical screenshots
cannot establish that a static gate is content. The existing visual fallback
for **height measurement** remains available after readiness succeeds.

### Verification and limits

Run from the repository root after installing workspace dependencies:

```sh
bun run --cwd packages/types build
bun run --cwd packages/tools build
bun run --cwd packages/tools typecheck
bun run --cwd packages/agent typecheck
bun test packages/tools/test packages/agent/test --timeout 10000
```

The fixtures evaluate the serialized browser expression against a simulated DOM
with explicit geometry. They cover a disappearing loader, benign and persistent
intro gates, protected controls, ordinary CTAs, late gates, and bounded waits.
Integration tests mock the Daytona SDK boundary while running the actual capture
and agent orchestration. They check tiles, cleanup, three-attempt recovery, error
propagation, and that failed captures never reach the model. Existing text-only
opt-in tests run in the same suite. Build tools before agent tests because the
agent resolves the tools package through its `dist` export.

These are automated mocked checks, not live Daytona/Chromium/OpenAI verification.
The detector does not infer the meaning of canvas pixels, closed shadow DOM, or
arbitrary animation and cannot recognize every custom gate. Unsupported labels
and ambiguous overlays may require a direct public URL. Stability is a bounded
DOM/geometry check, not a guarantee that every font, image, or later lazy-loaded
section has settled. Existing full-page scrolling and tile composition are
unchanged by this fix.

MIT © getdesign
