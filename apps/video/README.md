# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Voiceover (ElevenLabs)**

Requires [ffmpeg](https://ffmpeg.org/) (`ffmpeg` and `ffprobe` on your `PATH`). Copy [`.env.example`](./.env.example) to `.env`, set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`, then from this directory:

```console
bun run voiceover
```

That writes six MP3s under `public/voiceover/launch/` using **pad-only** normalization (no trimming TTS to a fixed length), then updates [`src/generated-voiceover.ts`](./src/generated-voiceover.ts) with **`SCENE_AUDIO_FRAMES`**, **`SCENE_FROM_FRAMES`**, and the total composition length so **each scene’s video matches its audio**. Commit `generated-voiceover.ts` after regenerating. Do not commit `.env` or the generated audio (they are gitignored).

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
