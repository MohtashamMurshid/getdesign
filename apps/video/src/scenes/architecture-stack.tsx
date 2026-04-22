import type { ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { colors, msToFrames, standardEase } from "../design-tokens";
import { fontMono, fontSans } from "../fonts";
import { SceneBackdrop } from "./chrome";
import { TECH_STACK } from "./tech-icons";

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
          How it&apos;s wired
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
          One agent core: coordinator plus crawler, visual (Daytona + Chromium),
          token extract, and synthesize — then deterministic design.md. Convex
          stores runs; surfaces differ only by transport.
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
              Request flow
            </div>
            <FlowBox delay={baseDelay} frame={frame} fps={fps}>
              <strong>Public URL</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                User input
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
              <strong>CoordinatorAgent</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                ToolLoopAgent · planning + delegate
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
                9 sections · Zod-validated render
              </div>
            </FlowBox>
            <ArrowDown />
            <FlowBox delay={baseDelay + step * 5.2} frame={frame} fps={fps}>
              <strong>Convex</strong>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                runs · UIMessages · screenshots · artifacts
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
              Tech stack
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 8,
                overflow: "hidden",
              }}
            >
              {TECH_STACK.map((tech, i) => {
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
                    key={tech.name}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface200,
                      padding: "12px 12px",
                      opacity: cellOp,
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        width: 36,
                        height: 36,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <tech.Icon width={28} height={28} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: fontSans,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: colors.foreground,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {tech.name}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          fontFamily: fontSans,
                          fontSize: 10.5,
                          lineHeight: 1.4,
                          color: colors.muted,
                        }}
                      >
                        {tech.detail}
                      </div>
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
