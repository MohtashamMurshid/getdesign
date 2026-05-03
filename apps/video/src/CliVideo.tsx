import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { colors, msToFrames, standardEase } from "./design-tokens";
import { fontMono, fontSans } from "./fonts";
import { AnimatedLockup, StaticLockup } from "./scenes/animated-lockup";
import {
  AmbientGlow,
  DashedBottomRule,
  SceneBackdrop,
} from "./scenes/chrome";

const FPS = 30;

const SCENE_DURATIONS_MS = {
  intro: 2600,
  terminal: 7400,
  output: 6800,
  cta: 3600,
} as const;

const SCENE_FRAMES = {
  intro: msToFrames(SCENE_DURATIONS_MS.intro, FPS),
  terminal: msToFrames(SCENE_DURATIONS_MS.terminal, FPS),
  output: msToFrames(SCENE_DURATIONS_MS.output, FPS),
  cta: msToFrames(SCENE_DURATIONS_MS.cta, FPS),
};

export const CLI_VIDEO_TOTAL_FRAMES =
  SCENE_FRAMES.intro +
  SCENE_FRAMES.terminal +
  SCENE_FRAMES.output +
  SCENE_FRAMES.cta;

const SCENE_FROM = {
  intro: 0,
  terminal: SCENE_FRAMES.intro,
  output: SCENE_FRAMES.intro + SCENE_FRAMES.terminal,
  cta: SCENE_FRAMES.intro + SCENE_FRAMES.terminal + SCENE_FRAMES.output,
};

// ────────────────────────────────────────────────────────────────────
// Scene 1 — Intro: lockup with package badge
// ────────────────────────────────────────────────────────────────────
function SceneIntro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOp = interpolate(
    frame,
    [msToFrames(900, fps), msToFrames(1500, fps)],
    [0, 1],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const badgeRise = interpolate(
    frame,
    [msToFrames(900, fps), msToFrames(1500, fps)],
    [16, 0],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <SceneBackdrop>
      <DashedBottomRule />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 36,
        }}
      >
        <AnimatedLockup frame={frame} scale={1.6} />
        <div
          style={{
            opacity: badgeOp,
            transform: `translateY(${badgeRise}px)`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            borderRadius: 999,
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface200,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: colors.accent,
              boxShadow: `0 0 12px ${colors.accent}`,
            }}
          />
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 18,
              color: colors.foreground,
              letterSpacing: "0.02em",
            }}
          >
            @getdesign/cli
          </span>
          <span
            style={{
              fontFamily: fontSans,
              fontSize: 16,
              color: colors.muted,
            }}
          >
            URL → design.md, in your terminal
          </span>
        </div>
      </AbsoluteFill>
    </SceneBackdrop>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scene 2 — Terminal: typing the command, then phase progress
// ────────────────────────────────────────────────────────────────────
const COMMAND = "bunx @getdesign/cli https://linear.app";

const PHASES = [
  { id: "crawl", label: "crawl", note: "fetching page + sub-routes" },
  { id: "capture", label: "capture", note: "headless screenshot" },
  { id: "visual", label: "visual", note: "vision model pass" },
  { id: "describe", label: "describe", note: "extracting tokens" },
  { id: "extract", label: "extract", note: "parsing computed CSS" },
  { id: "synthesize", label: "synthesize", note: "merging signals" },
  { id: "render", label: "render", note: "writing design.md" },
] as const;

function TypedCommand({
  prompt,
  text,
  startFrame,
  endFrame,
}: {
  prompt: string;
  text: string;
  startFrame: number;
  endFrame: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visibleChars = Math.round(text.length * progress);
  const visible = text.slice(0, visibleChars);
  const showCursor = Math.floor(frame / 8) % 2 === 0;

  return (
    <div
      style={{
        fontFamily: fontMono,
        fontSize: 22,
        color: colors.foreground,
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: colors.accent }}>{prompt}</span>{" "}
      <span>{visible}</span>
      {frame >= startFrame && frame < endFrame + 6 && showCursor ? (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 22,
            backgroundColor: colors.accent,
            transform: "translateY(4px)",
            marginLeft: 2,
          }}
        />
      ) : null}
    </div>
  );
}

function SceneTerminal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introOp = interpolate(frame, [0, msToFrames(420, fps)], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const typeStart = msToFrames(500, fps);
  const typeEnd = msToFrames(2200, fps);
  const phasesStart = msToFrames(2600, fps);
  const perPhase = msToFrames(620, fps);

  return (
    <SceneBackdrop>
      <AbsoluteFill
        style={{
          padding: "60px 80px",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          opacity: introOp,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: 920,
          }}
        >
          <p
            style={{
              fontFamily: fontMono,
              fontSize: 13,
              color: colors.accent,
              margin: 0,
            }}
          >
            ✦ One command
          </p>
          <span
            style={{
              fontFamily: fontSans,
              fontSize: 16,
              color: colors.muted,
            }}
          >
            zero config — keys via flag or env
          </span>
        </div>

        <div
          style={{
            width: 920,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface100,
            boxShadow: `0 32px 80px rgba(0,0,0,0.45)`,
          }}
        >
          {/* terminal chrome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              backgroundColor: colors.surface200,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span
                key={c}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: c,
                }}
              />
            ))}
            <span
              style={{
                marginLeft: 12,
                fontFamily: fontMono,
                fontSize: 12,
                color: colors.subtle,
              }}
            >
              ~/projects/site — bun
            </span>
          </div>

          {/* terminal body */}
          <div
            style={{
              padding: "32px 36px",
              minHeight: 600,
              backgroundColor: colors.background,
            }}
          >
            <TypedCommand
              prompt="$"
              text={COMMAND}
              startFrame={typeStart}
              endFrame={typeEnd}
            />

            {/* phases */}
            <div style={{ marginTop: 28, display: "grid", gap: 8 }}>
              {PHASES.map((p, i) => {
                const start = phasesStart + i * perPhase;
                const done = phasesStart + (i + 1) * perPhase - 6;
                const appear = interpolate(
                  frame,
                  [start, start + 12],
                  [0, 1],
                  {
                    easing: standardEase,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                );
                const isDone = frame >= done;
                const isActive = frame >= start && frame < done;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px 130px 1fr 80px",
                      gap: 14,
                      alignItems: "center",
                      opacity: appear,
                      fontFamily: fontMono,
                      fontSize: 15,
                    }}
                  >
                    <span
                      style={{
                        color: isDone ? colors.accent : colors.subtle,
                        fontSize: 14,
                      }}
                    >
                      {isDone ? "✓" : isActive ? "◇" : "·"}
                    </span>
                    <span
                      style={{
                        color: isDone
                          ? colors.foreground
                          : isActive
                            ? colors.accent
                            : colors.muted,
                      }}
                    >
                      {p.label}
                    </span>
                    <span style={{ color: colors.subtle, fontSize: 13 }}>
                      {p.note}
                    </span>
                    <span
                      style={{
                        color: isDone ? colors.accentDim : colors.subtle,
                        fontSize: 12,
                        textAlign: "right",
                      }}
                    >
                      {isDone ? "done" : isActive ? "…" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneBackdrop>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scene 3 — design.md output reveal (split: terminal log + file)
// ────────────────────────────────────────────────────────────────────
const DESIGN_MD_LINES: { kind: "h1" | "h2" | "p" | "kv" | "blank"; text: string }[] = [
  { kind: "h1", text: "# Linear" },
  { kind: "p", text: "Generated by @getdesign/cli on May 3, 2026" },
  { kind: "blank", text: "" },
  { kind: "h2", text: "## Visual theme" },
  { kind: "p", text: "Dense product UI · sharp contrast · purposeful motion." },
  { kind: "blank", text: "" },
  { kind: "h2", text: "## Color tokens" },
  { kind: "kv", text: "--background: #08090b" },
  { kind: "kv", text: "--foreground: #f7f8f8" },
  { kind: "kv", text: "--accent:     #5e6ad2" },
  { kind: "kv", text: "--muted:      rgba(247,248,248,0.6)" },
  { kind: "blank", text: "" },
  { kind: "h2", text: "## Typography" },
  { kind: "kv", text: "Inter Variable · -0.022em tracking" },
  { kind: "blank", text: "" },
  { kind: "h2", text: "## Components" },
  { kind: "p", text: "Compact controls · 8px radii · medium labels." },
];

function MarkdownLine({
  line,
}: {
  line: (typeof DESIGN_MD_LINES)[number];
}) {
  const base = {
    fontFamily: fontMono,
    fontSize: 14,
    lineHeight: 1.7,
  } as const;
  if (line.kind === "blank") {
    return <div style={{ height: 8 }} />;
  }
  if (line.kind === "h1") {
    return (
      <div style={{ ...base, color: colors.foreground, fontSize: 18 }}>
        <span style={{ color: "#c084fc" }}># </span>
        {line.text.replace(/^#\s/, "")}
      </div>
    );
  }
  if (line.kind === "h2") {
    return (
      <div style={{ ...base, color: colors.foreground }}>
        <span style={{ color: "#c084fc" }}>## </span>
        {line.text.replace(/^##\s/, "")}
      </div>
    );
  }
  if (line.kind === "kv") {
    const [k, ...rest] = line.text.split(":");
    return (
      <div style={base}>
        <span style={{ color: "#f472b6" }}>{k}</span>
        <span style={{ color: colors.subtle }}>:</span>
        <span style={{ color: "#a3e635" }}>{rest.join(":")}</span>
      </div>
    );
  }
  return <div style={{ ...base, color: colors.muted }}>{line.text}</div>;
}

function SceneOutput() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, msToFrames(360, fps)], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const linesStart = msToFrames(500, fps);
  const linePer = 6;

  return (
    <SceneBackdrop>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.85fr 1.15fr",
          gap: 40,
          padding: "60px 72px",
          height: "100%",
          alignItems: "center",
          opacity: headerOp,
        }}
      >
        {/* left: success log */}
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.surface200,
              fontFamily: fontMono,
              fontSize: 12,
              color: colors.subtle,
            }}
          >
            stderr · progress
          </div>
          <div
            style={{
              padding: 22,
              fontFamily: fontMono,
              fontSize: 13,
              color: colors.muted,
              lineHeight: 1.7,
              backgroundColor: colors.background,
            }}
          >
            <div>
              <span style={{ color: colors.accent }}>✓</span> crawl
              <span style={{ color: colors.subtle }}> 1.2s</span>
            </div>
            <div>
              <span style={{ color: colors.accent }}>✓</span> capture
              <span style={{ color: colors.subtle }}> 2.4s</span>
            </div>
            <div>
              <span style={{ color: colors.accent }}>✓</span> visual
              <span style={{ color: colors.subtle }}> 4.8s</span>
            </div>
            <div>
              <span style={{ color: colors.accent }}>✓</span> extract
              <span style={{ color: colors.subtle }}> 0.6s</span>
            </div>
            <div>
              <span style={{ color: colors.accent }}>✓</span> synthesize
              <span style={{ color: colors.subtle }}> 3.1s</span>
            </div>
            <div>
              <span style={{ color: colors.accent }}>✓</span> render
              <span style={{ color: colors.subtle }}> 0.1s</span>
            </div>
            <div style={{ height: 12 }} />
            <div style={{ color: colors.foreground }}>
              wrote{" "}
              <span style={{ color: colors.accent }}>
                getdesign-runs/linear/design.md
              </span>
            </div>
            <div style={{ color: colors.subtle, fontSize: 12 }}>
              9 sections · 4.2 KB · 12.3s total
            </div>
          </div>
        </div>

        {/* right: design.md preview */}
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.surface200,
            }}
          >
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 12,
                color: colors.foreground,
              }}
            >
              design.md
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: fontMono,
                fontSize: 11,
                color: colors.subtle,
              }}
            >
              cursor-ready
            </span>
          </div>
          <div
            style={{
              padding: 24,
              backgroundColor: colors.background,
              minHeight: 460,
            }}
          >
            {DESIGN_MD_LINES.map((line, i) => {
              const op = interpolate(
                frame,
                [linesStart + i * linePer, linesStart + i * linePer + 10],
                [0, 1],
                {
                  easing: standardEase,
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              );
              const tx = interpolate(
                frame,
                [linesStart + i * linePer, linesStart + i * linePer + 10],
                [6, 0],
                {
                  easing: standardEase,
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              );
              return (
                <div
                  key={i}
                  style={{ opacity: op, transform: `translateY(${tx}px)` }}
                >
                  <MarkdownLine line={line} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scene 4 — CTA: install/usage
// ────────────────────────────────────────────────────────────────────
function SceneCta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const heroSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.9 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <AmbientGlow />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 28,
          padding: 64,
        }}
      >
        <div
          style={{
            opacity: heroSpring,
            transform: `translateY(${(1 - heroSpring) * 18}px)`,
          }}
        >
          <StaticLockup scale={0.85} />
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: fontSans,
            fontSize: 24,
            color: colors.muted,
            opacity: interpolate(
              frame,
              [msToFrames(280, fps), msToFrames(700, fps)],
              [0, 1],
              {
                easing: standardEase,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          Generate a design system from any URL
          <span style={{ color: colors.accent }}>.</span>
        </p>

        <div
          style={{
            marginTop: 20,
            padding: "20px 28px",
            borderRadius: 14,
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface100,
            fontFamily: fontMono,
            fontSize: 22,
            color: colors.accent,
            opacity: interpolate(
              frame,
              [msToFrames(400, fps), msToFrames(900, fps)],
              [0, 1],
              {
                easing: standardEase,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
            transform: `translateY(${interpolate(
              frame,
              [msToFrames(400, fps), msToFrames(900, fps)],
              [10, 0],
              {
                easing: standardEase,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )}px)`,
          }}
        >
          bunx @getdesign/cli &lt;url&gt;
        </div>

        <div
          style={{
            marginTop: 6,
            display: "flex",
            gap: 12,
            opacity: interpolate(
              frame,
              [msToFrames(700, fps), msToFrames(1200, fps)],
              [0, 1],
              {
                easing: standardEase,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          {["--out", "--site-name", "--text-only-fallback"].map((flag) => (
            <span
              key={flag}
              style={{
                fontFamily: fontMono,
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${colors.borderStrong}`,
                backgroundColor: colors.surface200,
                color: colors.foreground,
              }}
            >
              {flag}
            </span>
          ))}
        </div>

        <p
          style={{
            marginTop: 10,
            fontFamily: fontMono,
            fontSize: 16,
            color: colors.accent,
            opacity: interpolate(
              frame,
              [msToFrames(900, fps), msToFrames(1400, fps)],
              [0, 1],
              {
                easing: standardEase,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          getdesign.app
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ────────────────────────────────────────────────────────────────────
// Composition
// ────────────────────────────────────────────────────────────────────
export const CliVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Sequence durationInFrames={SCENE_FRAMES.intro}>
        <SceneIntro />
      </Sequence>
      <Sequence
        from={SCENE_FROM.terminal}
        durationInFrames={SCENE_FRAMES.terminal}
      >
        <SceneTerminal />
      </Sequence>
      <Sequence
        from={SCENE_FROM.output}
        durationInFrames={SCENE_FRAMES.output}
      >
        <SceneOutput />
      </Sequence>
      <Sequence from={SCENE_FROM.cta} durationInFrames={SCENE_FRAMES.cta}>
        <SceneCta />
      </Sequence>
    </AbsoluteFill>
  );
};
