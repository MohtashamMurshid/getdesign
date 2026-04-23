# GetDesign Launch Video

This app renders the `LaunchVideo` Remotion composition for GetDesign.

## Composition

- `id`: `LaunchVideo`
- `fps`: `30`
- `size`: `1920x1080`
- `duration`: generated from [`src/generated-voiceover.ts`](./src/generated-voiceover.ts)

## Commands

### Install dependencies

```console
bun install
```

### Start preview

```console
bun run dev
```

### Render the video

```console
bunx remotion render LaunchVideo out/launch-video.mp4
```

Latest render output:

```text
out/launch-video.mp4
```

### Regenerate voiceover and captions

Requires [ffmpeg](https://ffmpeg.org/) (`ffmpeg` and `ffprobe` on your `PATH`). Copy [`.env.example`](./.env.example) to `.env`, set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`, then run:

```console
bun run voiceover
```

That command:

- writes six MP3 files under `public/voiceover/launch/`
- regenerates [`src/generated-voiceover.ts`](./src/generated-voiceover.ts) so scene durations match audio
- writes `public/voiceover/launch/captions.json` for [`src/caption-layer.tsx`](./src/caption-layer.tsx)

Commit `src/generated-voiceover.ts` after regenerating. Do not commit `.env` or generated audio assets.

### Lint and typecheck

```console
bun run lint
```
