# Studio

Electron desktop app for getdesign.

## Stack

- Electron + electron-vite
- React 19 + TypeScript
- Vite
- electron-builder (packaging)

## Scripts

```bash
bun run dev          # start dev (HMR for renderer, restart for main)
bun run build        # build main, preload, renderer
bun run build:mac    # package macOS dmg/zip
bun run build:win    # package Windows nsis
bun run build:linux  # package Linux AppImage/deb
bun run typecheck    # tsc on node + web projects
```

## Layout

```
src/
  main/      # Electron main process (+ updater)
  preload/   # contextBridge surface
  renderer/  # React app (Vite)
```

## Releases (GitHub)

Distribution & auto-updates run through GitHub Releases via `electron-builder` +
`electron-updater`. Config lives in `electron-builder.yml`.

### Cut a release

1. From `apps/studio`, run `bun run version:patch` (or `:minor` / `:major`).
   This bumps `package.json`, commits, and creates a `studio-vX.Y.Z` git tag.
2. Push: `git push origin main --tags`
3. The `Studio Release` workflow (`.github/workflows/studio-release.yml`) builds
   on macOS, Windows, and Linux runners and publishes artifacts (`.dmg`, `.zip`,
   `.exe`, `.AppImage`, `.deb`) plus `latest*.yml` update manifests to the
   matching GitHub Release.

### Auto-updates

The packaged app checks GitHub Releases on launch via `electron-updater`. When a
newer release is found it downloads in the background and prompts the user to
restart.

### Code signing (optional)

Add the following repo secrets to enable signing/notarization in CI and uncomment
the matching `env:` lines in the workflow:

- macOS: `MAC_CERTS`, `MAC_CERTS_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
- Windows: `WIN_CERTS`, `WIN_CERTS_PASSWORD`
