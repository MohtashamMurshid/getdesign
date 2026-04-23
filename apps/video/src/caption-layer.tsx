import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";

import { colors } from "./design-tokens";
import { fontSans } from "./fonts";
import { SCENE_FROM_FRAMES } from "./generated-voiceover";

const COMBINE_MS = 900;

const SCENE_CAPTION_STYLES = [
  { bottom: 104, fontSize: 46, maxWidth: 880 },
  { bottom: 108, fontSize: 42, maxWidth: 860 },
  { bottom: 146, fontSize: 38, maxWidth: 760 },
  { bottom: 108, fontSize: 40, maxWidth: 820 },
  { bottom: 122, fontSize: 36, maxWidth: 780 },
  { bottom: 154, fontSize: 42, maxWidth: 760 },
] as const;

function getSceneIndex(pageStartMs: number, fps: number) {
  const pageFrame = Math.round((pageStartMs / 1000) * fps);

  for (let i = SCENE_FROM_FRAMES.length - 1; i >= 0; i--) {
    if (pageFrame >= SCENE_FROM_FRAMES[i]!) {
      return i;
    }
  }

  return 0;
}

function startsNewSentence(previousText: string): boolean {
  return /[.!?]["')\]]*$/.test(previousText.trimEnd());
}

function CaptionPage({
  page,
  durationInFrames,
}: {
  page: TikTokPage;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;
  const sceneStyle =
    SCENE_CAPTION_STYLES[getSceneIndex(page.startMs, fps)] ??
    SCENE_CAPTION_STYLES[0];
  const intro = Math.min(1, frame / 6);
  const outroStart = Math.max(0, durationInFrames - 6);
  const outro =
    frame < outroStart ? 1 : Math.max(0, (durationInFrames - frame) / 6);
  const opacity = intro * outro;
  const translateY = (1 - opacity) * 18;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: `0 56px ${sceneStyle.bottom}px`,
        pointerEvents: "none",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          padding: "16px 24px 14px",
          borderRadius: 24,
          border: `1px solid ${colors.borderStrong}`,
          backgroundColor: "rgba(10, 10, 11, 0.72)",
          boxShadow: "0 18px 54px rgba(0, 0, 0, 0.32)",
          fontFamily: fontSans,
          fontSize: sceneStyle.fontSize,
          fontWeight: 600,
          lineHeight: 1.16,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          maxWidth: `min(${sceneStyle.maxWidth}px, 86%)`,
          letterSpacing: "-0.03em",
          textWrap: "balance",
          textShadow: "0 2px 24px rgba(0,0,0,0.75)",
        }}
      >
        {page.tokens.map((token, ti) => {
          const active =
            token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          const previousToken = ti > 0 ? page.tokens[ti - 1] : null;
          const startsSentence =
            previousToken !== null && startsNewSentence(previousToken.text);
          const displayText =
            ti === 0
              ? token.text.trimStart()
              : startsSentence
                ? `\n${token.text.trimStart()}`
                : token.text;
          return (
            <span
              key={`${token.fromMs}-${token.toMs}-${ti}`}
              style={{
                color: active ? colors.accent : "rgba(237, 237, 238, 0.82)",
              }}
            >
              {displayText}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export function CaptionLayer() {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const { fps } = useVideoConfig();

  const load = useCallback(async () => {
    try {
      const res = await fetch(staticFile("voiceover/launch/captions.json"));
      if (!res.ok) {
        setCaptions([]);
      } else {
        const data = (await res.json()) as Caption[];
        setCaptions(Array.isArray(data) ? data : []);
      }
    } catch {
      setCaptions([]);
    } finally {
      continueRender(handle);
    }
  }, [continueRender, handle]);

  useEffect(() => {
    void load();
  }, [load]);

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      captions: captions ?? [],
      combineTokensWithinMilliseconds: COMBINE_MS,
    });
  }, [captions]);

  if (captions === null || pages.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(10,10,11,0) 0%, rgba(10,10,11,0.06) 52%, rgba(10,10,11,0.42) 100%)",
        }}
      />
      {pages.map((page, index) => {
        const next = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const nextStart = next
          ? Math.round((next.startMs / 1000) * fps)
          : Number.POSITIVE_INFINITY;
        const endBySwitch = Math.round(
          startFrame + (COMBINE_MS / 1000) * fps,
        );
        const endFrame = Math.min(nextStart, endBySwitch);
        const durationInFrames = Math.max(1, endFrame - startFrame);

        return (
          <Sequence
            key={`${page.startMs}-${index}`}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <CaptionPage page={page} durationInFrames={durationInFrames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
