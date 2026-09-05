import InteractiveDemo from "../interactive-demo";

/** Third scene’s audio length (frames @ 30fps) — see `apps/video/src/generated-voiceover.ts` `SCENE_AUDIO_FRAMES[2]`. */
export const HOW_IT_WORKS_REMOTION_FRAMES = 390;

export function HowItWorksSection() {
  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="display-md">How it works</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Explore a sample run across web, API, CLI, and SDK. This is an
          animated demo, not a live extraction. Real runs use your Daytona
          and OpenAI keys, and duration varies by site.
        </p>
      </div>

      <div className="mt-10">
        <InteractiveDemo />
      </div>
    </div>
  );
}
