import InteractiveDemo from "../interactive-demo";

/** Third scene’s audio length (frames @ 30fps) — see `apps/video/src/generated-voiceover.ts` `SCENE_AUDIO_FRAMES[2]`. */
export const HOW_IT_WORKS_REMOTION_FRAMES = 390;

export function HowItWorksSection() {
  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="display-md">How it works</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Pick a site, then switch between web, api, cli, and sdk. Every
          surface calls the same agent core; only the transport changes.
        </p>
      </div>

      <div className="mt-10">
        <InteractiveDemo />
      </div>
    </div>
  );
}
