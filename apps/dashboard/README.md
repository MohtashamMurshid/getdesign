# Dashboard

The authenticated dashboard uses WorkOS AuthKit and Convex. V1 runs use one
stored Daytona key and one stored OpenAI key per user.

## Required environment

- Set `WORKOS_CLIENT_ID` in both the dashboard and Convex deployments. Convex
  uses it to verify WorkOS access tokens before any credential read or write.
- Set `GETDESIGN_CREDENTIALS_KEY` in the dashboard deployment to 32 bytes,
  encoded as 64 hexadecimal characters or base64.
- Set `NEXT_PUBLIC_CONVEX_URL` for the dashboard deployment.

Dashboard runs do not read `DAYTONA_API_KEY` or `OPENAI_API_KEY` from the host
environment. Users save both keys on Account before starting a visual run.

## Local checks

```sh
bun test apps/dashboard/lib convex
bun run --cwd apps/dashboard typecheck
```

## App icons

`app/icon.svg` is copied from `apps/web/app/icon.svg`, the existing getdesign
brand mark. Its raster exports are `app/favicon.ico` with 16, 32 and 48px
frames, `app/apple-icon.png` at 180px, and `public/icons/icon-{192,512}.png`.
The PNG exports use the mark's opaque `#0a0a0b` background for home screens.
Regenerate these exports from the source SVG when the brand mark changes.

Next.js adds the SVG, ICO, Apple touch icon and manifest links through its
metadata file conventions. The manifest keeps `display: "browser"` because
the dashboard does not provide an offline or standalone app experience.
