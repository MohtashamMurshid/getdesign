import type { ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { colors, msToFrames, standardEase } from "../design-tokens";
import { fontMono, fontSans } from "../fonts";
import { SceneBackdrop } from "./chrome";

function ArrowDown() {
  return (
    <div
      style={{
        textAlign: "center",
        color: colors.subtle,
        fontSize: 18,
        padding: "4px 0",
      }}
    >
      ↓
    </div>
  );
}

function FlowBox({
  children,
  accent,
  delay,
  frame,
  fps,
}: {
  children: ReactNode;
  accent?: boolean;
  delay: number;
  frame: number;
  fps: number;
}) {
  const op = interpolate(
    frame,
    [delay, delay + msToFrames(380, fps)],
    [0, 1],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const y = interpolate(
    frame,
    [delay, delay + msToFrames(380, fps)],
    [14, 0],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        opacity: op,
        transform: `translateY(${y}px)`,
        borderRadius: 10,
        border: `1px solid ${accent ? colors.accent : colors.border}`,
        backgroundColor: accent ? `${colors.accent}14` : colors.surface100,
        padding: "12px 16px",
        textAlign: "center",
        fontFamily: fontSans,
        fontSize: 14,
        color: colors.foreground,
      }}
    >
      {children}
    </div>
  );
}

const STACK_PILLARS = [
  {
    title: "Interfaces",
    detail: "Web, API, CLI, SDK, and IDE skill all point at the same run graph.",
  },
  {
    title: "Capture",
    detail: "Bun, Daytona, and Chromium gather live DOM, CSS, and screenshot context.",
  },
  {
    title: "Synthesis",
    detail: "AI SDK plus Zod turn extracted tokens into a consistent design.md.",
  },
  {
    title: "State",
    detail: "Convex stores runs, messages, screenshots, and artifacts for replay.",
  },
  {
    title: "Delivery",
    detail: "Vercel, Turborepo, and Remotion ship product, platform, and launch assets together.",
  },
] as const;

/** Fifth scene; duration follows `SCENE_AUDIO_FRAMES[4]` from generated voiceover. */
export function SceneArchitectureStack() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, msToFrames(400, fps)], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const gridOp = interpolate(
    frame,
    [msToFrames(500, fps), msToFrames(900, fps)],
    [0, 1],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const baseDelay = msToFrames(200, fps);
  const step = msToFrames(110, fps);

  return (
    <SceneBackdrop>
      <div
        style={{
          display: "flex",
          height: "100%",
          flexDirection: "column",
          padding: "40px 56px 36px",
        }}
      >
        <p
          style={{
            fontFamily: fontMono,
            fontSize: 13,
            color: colors.accent,
            margin: 0,
            opacity: titleOp,
          }}
        >
          ✦ Architecture
        </p>
        <h2
          style={{
            margin: "8px 0 6px",
            fontFamily: fontSans,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: colors.foreground,
            opacity: titleOp,
          }}
        >
          Same core, every surface
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            maxWidth: 720,
            fontFamily: fontSans,
            fontSize: 15,
            lineHeight: 1.55,
            color: colors.muted,
            opacity: titleOp,
          }}
        >
          One coordinator orchestrates crawl, capture, extraction, and synthesis.
          Web, API, CLI, SDK, and the IDE skill all hit the same system, so the
          output stays consistent.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1.35fr)",
            gap: 28,
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface100,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: colors.subtle,
                marginBottom: 12,
              }}
            >
              Run graph
            </div>
            <FlowBox delay={baseDelay} frame={frame} fps={fps}>
              <strong>Public URL</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                one input, every surface
              </div>
            </FlowBox>
            <ArrowDown />
            <FlowBox delay={baseDelay + step} frame={frame} fps={fps}>
              <strong>Surfaces</strong>
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  color: colors.muted,
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                Web · API · CLI · SDK · Skill
              </div>
            </FlowBox>
            <ArrowDown />
            <FlowBox delay={baseDelay + step * 2} frame={frame} fps={fps} accent>
              <strong>Coordinator</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                plans, delegates, keeps output aligned
              </div>
            </FlowBox>
            <ArrowDown />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                "CrawlerAgent",
                "VisualAgent",
                "TokenExtractor",
                "Synthesizer",
              ].map((label, i) => (
                <FlowBox
                  key={label}
                  delay={baseDelay + step * (3 + i * 0.35)}
                  frame={frame}
                  fps={fps}
                >
                  <span style={{ fontSize: 12.5 }}>{label}</span>
                </FlowBox>
              ))}
            </div>
            <ArrowDown />
            <FlowBox
              delay={baseDelay + step * 4.5}
              frame={frame}
              fps={fps}
              accent
            >
              <strong>design.md</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                9 sections + prompt guide
              </div>
            </FlowBox>
            <ArrowDown />
            <FlowBox delay={baseDelay + step * 5.2} frame={frame} fps={fps}>
              <strong>Convex</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                runs, screenshots, artifacts, resume state
              </div>
            </FlowBox>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface100,
              padding: 20,
              opacity: gridOp,
            }}
          >
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: colors.subtle,
                marginBottom: 14,
              }}
            >
              System pillars
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                overflow: "hidden",
              }}
            >
              {STACK_PILLARS.map((pillar, i) => {
                const d = i * 2;
                const cellOp = interpolate(
                  frame,
                  [
                    msToFrames(520, fps) + d,
                    msToFrames(520, fps) + d + 12,
                  ],
                  [0, 1],
                  {
                    easing: standardEase,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                );
                return (
                  <div
                    key={pillar.title}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface200,
                      padding: "14px 14px 15px",
                      opacity: cellOp,
                      gridColumn:
                        i === STACK_PILLARS.length - 1 ? "1 / -1" : "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: colors.accent,
                          boxShadow: `0 0 18px ${colors.accentGlow}`,
                        }}
                      />
                      <div
                        style={{
                          fontFamily: fontSans,
                          fontSize: 13,
                          fontWeight: 600,
                          color: colors.foreground,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {pillar.title}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontFamily: fontSans,
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        color: colors.muted,
                      }}
                    >
                      {pillar.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
}
