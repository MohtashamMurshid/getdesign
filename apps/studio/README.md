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
  main/      # Electron main process
  preload/   # contextBridge surface
  renderer/  # React app (Vite)
```
