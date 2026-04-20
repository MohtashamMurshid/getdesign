## Daytona snapshot

This directory contains the baseline image definition for the `getdesign` visual
capture sandbox.

### What is included

- Chromium for kiosk-style browsing
- Xvfb + lightweight X11 utilities for deterministic display capture
- fonts commonly needed by marketing sites (`Inter`, `Noto`, `Liberation`, `DejaVu`)
- image tooling needed by the screenshot pipeline

### Example workflow

Build and publish from a machine that has the Daytona CLI configured:

```bash
docker build -t getdesign-daytona-snapshot infra/daytona
daytona snapshot create getdesign-local --image getdesign-daytona-snapshot
daytona snapshot push getdesign-local getdesign-<sha>
```

The runtime code in `packages/tools/src/daytona` expects the published snapshot
name to be passed in explicitly, or derived from a `getdesign-<sha>` convention.
