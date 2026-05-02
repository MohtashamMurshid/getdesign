# Daytona capture runtime image

This directory contains the Dockerfile for the **getdesign capture runtime image** — the public, versioned OCI image that backs every BYOK user's reusable Daytona snapshot for full landing page capture.

End users **do not build this image themselves**. The app's `ensureDaytonaCaptureSnapshot` (see [`packages/tools/src/daytona/runtime.ts`](../../packages/tools/src/daytona/runtime.ts)) pulls the pinned digest into the user's own Daytona account as an immutable snapshot named `getdesign-capture-<runtimeVersion>`.

## What's in the image

- The `getdesign-chromium` wrapper, which launches Chromium with capture-friendly flags (no sandbox, srgb color profile, hidden scrollbars, deterministic profile dir) and binds Chrome DevTools Protocol to **`127.0.0.1:9222`**. The host agent reaches CDP over an SSH tunnel via the Daytona TS SDK; the port is never publicly exposed (no `EXPOSE 9222`, no Daytona preview link). See [ADR 0003](../../apps/web/docs/adr/0003-cdp-capture-control-surface.md).
- Daytona Computer Use desktop helpers (`dbus-x11`, `wmctrl`, `x11-utils`, `xdotool`, `xvfb`). Daytona owns the desktop via `computerUse.start()`; the image does not run a self-managed Xvfb.
- Fonts for Latin/Cyrillic/Greek + emoji + CJK + common product fonts (Inter, Roboto, Noto core/CJK/emoji/mono/UI, DejaVu, Liberation).
- `chromium --version` is captured at image build time and embedded into `/etc/getdesign/runtime.json` along with the build's runtime version, so support and the `getdesign-doctor` probe can verify provenance.
- A `getdesign-doctor` script that prints `/etc/getdesign/runtime.json`, `$DISPLAY`, Xvfb process count, and font count for diagnostic use.

## Publishing (getdesign maintainers only)

CI builds and publishes to GitHub Container Registry, pinned by digest:

```
ghcr.io/<org>/getdesign-capture-runtime:<runtime-version>
```

Bumping `CAPTURE_RUNTIME_VERSION` in [`packages/tools/src/daytona/runtime.ts`](../../packages/tools/src/daytona/runtime.ts) produces a new versioned image and snapshot name. Old runtime versions stay reproducible against earlier snapshots.

## Local development build (image authors only)

Use Buildx with an explicit linux/amd64 platform pin so the image matches Daytona's runner architecture regardless of host:

```bash
docker buildx build \
  --platform linux/amd64 \
  --build-arg GETDESIGN_RUNTIME_VERSION=$(date +%Y-%m-%d)-$(git rev-parse --short HEAD) \
  -t ghcr.io/<org>/getdesign-capture-runtime:dev \
  infra/daytona
```

Notes that hold for both CI and local builds:

- No `EXPOSE 9222`. CDP is localhost-only inside the sandbox.
- No `HEALTHCHECK`. Daytona uses `getdesign-doctor` instead.
- No `ENTRYPOINT`. Daytona's default `sleep infinity` is used.
- No multi-stage build.
- No `--window-size`; viewport comes from the `GETDESIGN_VIEWPORT_*` env vars.
- The platform pin is set at build time, not in the Dockerfile itself.
