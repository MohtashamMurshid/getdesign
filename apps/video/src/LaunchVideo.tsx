import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  paletteShowcase,
  colors,
  msToFrames,
  standardEase,
} from "./design-tokens";
import {
  SCENE_AUDIO_FRAMES,
  SCENE_FROM_FRAMES,
} from "./generated-voiceover";
import { fontMono, fontSans } from "./fonts";
import { AnimatedLockup, StaticLockup } from "./scenes/animated-lockup";
import { BrowserChrome, FakeLandingPage } from "./scenes/browser-mock";
import {
  AmbientGlow,
  DashedBottomRule,
  SceneBackdrop,
} from "./scenes/chrome";
import { CaptionLayer } from "./caption-layer";
import { SceneArchitectureStack } from "./scenes/architecture-stack";
import { HowItWorksDashboard } from "./scenes/how-it-works-dashboard";

const SECTIONS = [
  "Logo",
  "Palette",
  "Typography",
  "Spacing",
  "Components",
  "Motion",
  "Voice",
] as const;

function SceneLogoIntro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const holdBreath = interpolate(
    frame,
    [msToFrames(3200, fps), msToFrames(4000, fps)],
    [1, 0.97],
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
          transform: `scale(${holdBreath})`,
        }}
      >
        <AnimatedLockup frame={frame} scale={1.85} />
      </AbsoluteFill>
    </SceneBackdrop>
  );
}

function SceneWhatIsIt() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = interpolate(frame, [0, msToFrames(550, fps)], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(frame, [0, msToFrames(550, fps)], [28, 0], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const browserX = interpolate(
    frame,
    [msToFrames(120, fps), msToFrames(520, fps)],
    [56, 0],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const browserOp = interpolate(
    frame,
    [msToFrames(120, fps), msToFrames(480, fps)],
    [0, 1],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <SceneBackdrop>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.05fr",
          gap: 56,
          height: "100%",
          padding: "72px 80px",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ marginBottom: 28, opacity: intro }}>
            <StaticLockup scale={0.42} />
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: fontSans,
              fontSize: 52,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              fontWeight: 600,
              color: colors.foreground,
              opacity: intro,
              transform: `translateY(${rise}px)`,
              maxWidth: 560,
            }}
          >
            Turn a public URL into a design system
            <span style={{ color: colors.accent }}>.</span>
          </h2>
          <p
            style={{
              marginTop: 24,
              fontFamily: fontSans,
              fontSize: 20,
              lineHeight: 1.55,
              color: colors.muted,
              maxWidth: 480,
              opacity: intro,
              transform: `translateY(${rise * 0.6}px)`,
            }}
          >
            Point GetDesign at a real page. It reads live CSS, captures the
            interface in-browser, and assembles a build-ready{" "}
            <span style={{ color: colors.foreground }}>design.md</span> grounded
            in what the site actually ships.
          </p>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              opacity: interpolate(
                frame,
                [msToFrames(400, fps), msToFrames(700, fps)],
                [0, 1],
                {
                  easing: standardEase,
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
            }}
          >
            {[
              "Live CSS",
              "Browser capture",
              "9 sections",
              "Prompt guide",
            ].map((label) => (
              <span
                key={label}
                style={{
                  fontFamily: fontMono,
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${colors.borderStrong}`,
                  backgroundColor: colors.surface200,
                  color: colors.foreground,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            opacity: browserOp,
            transform: `translateX(${browserX}px)`,
          }}
        >
          <BrowserChrome url="https://stripe.com">
            <FakeLandingPage />
          </BrowserChrome>
        </div>
      </div>
    </SceneBackdrop>
  );
}

function SceneHowItWorksDashboard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, msToFrames(400, fps)], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneBackdrop>
      <div
        style={{
          display: "flex",
          height: "100%",
          flexDirection: "column",
          padding: "44px 52px 36px",
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
          ✦ How it works
        </p>
        <h2
          style={{
            margin: "10px 0 6px",
            fontFamily: fontSans,
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: colors.foreground,
            opacity: titleOp,
          }}
        >
          One engine, five ways in
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            maxWidth: 560,
            fontFamily: fontSans,
            fontSize: 15,
            lineHeight: 1.55,
            color: colors.muted,
            opacity: titleOp,
          }}
        >
          Crawl once, capture once, synthesize once. Then watch the same run
          show up in web, API, CLI, SDK, and the IDE skill.
        </p>
        <div style={{ flex: 1, minHeight: 0 }}>
          <HowItWorksDashboard />
        </div>
      </div>
    </SceneBackdrop>
  );
}

function SceneDeliverables() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const docScroll = interpolate(
    frame,
    [0, msToFrames(2400, fps)],
    [0, -72],
    {
      easing: Easing.linear,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <SceneBackdrop>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 48,
          padding: "64px 72px",
          height: "100%",
          alignItems: "center",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface100,
          }}
        >
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
            <Img
              src={staticFile("app-icon.svg")}
              style={{ width: 22, height: 22, borderRadius: 5 }}
            />
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
              live preview
            </span>
          </div>
          <div
            style={{
              padding: 22,
              transform: `translateY(${docScroll}px)`,
              fontFamily: fontMono,
              fontSize: 13,
              lineHeight: 1.65,
              color: colors.muted,
              minHeight: 420,
              backgroundColor: colors.background,
            }}
          >
            <span style={{ color: "#c084fc" }}>## </span>
            <span style={{ color: colors.foreground }}>Visual theme</span>
            <br />
            <span style={{ color: colors.subtle }}>
              Dense product UI, sharp contrast, deliberate accent moments.
            </span>
            <br />
            <br />
            <span style={{ color: "#c084fc" }}>## </span>
            <span style={{ color: colors.foreground }}>Color palette</span>
            <br />
            <span style={{ color: colors.subtle }}>
              Derived from computed styles, not guessed.
            </span>
            <br />
            <br />
            <span style={{ color: "#f472b6" }}>--background</span>
            <span style={{ color: colors.subtle }}>: </span>
            <span style={{ color: "#a3e635" }}>#0a0a0b</span>
            <br />
            <span style={{ color: "#f472b6" }}>--accent</span>
            <span style={{ color: colors.subtle }}>: </span>
            <span style={{ color: "#a3e635" }}>#a3e635</span>
            <br />
            <br />
            <span style={{ color: "#c084fc" }}>## </span>
            <span style={{ color: colors.foreground }}>Components</span>
            <br />
            <span style={{ color: colors.subtle }}>
              8px radii · compact controls · medium labels · strong borders
            </span>
            <br />
            <br />
            <span style={{ color: "#c084fc" }}>## </span>
            <span style={{ color: colors.foreground }}>Motion</span>
            <br />
            <span style={{ color: colors.subtle }}>
              cubic-bezier(0.2, 0.7, 0.2, 1) · 220–520ms
            </span>
            <br />
            <br />
            <span style={{ color: "#c084fc" }}>## </span>
            <span style={{ color: colors.foreground }}>Prompt guide</span>
            <br />
            <span style={{ color: colors.subtle }}>
              Reuse the brand voice, contrast system, and component density in
              every follow-up prompt.
            </span>
          </div>
        </div>

        <div>
          <p
            style={{
              fontFamily: fontMono,
              fontSize: 13,
              color: colors.accent,
              margin: "0 0 12px",
            }}
          >
            ✦ What you get
          </p>
          <h2
            style={{
              margin: "0 0 28px",
              fontFamily: fontSans,
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: colors.foreground,
            }}
          >
            A design system, not just a screenshot
          </h2>
          <p
            style={{
              margin: "0 0 22px",
              maxWidth: 470,
              fontFamily: fontSans,
              fontSize: 16,
              lineHeight: 1.6,
              color: colors.muted,
            }}
          >
            The output is structured for handoff: design tokens, component
            patterns, motion rules, responsive guidance, and prompts your team
            can keep building from.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 28,
            }}
          >
            {SECTIONS.map((name, i) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface100,
                  opacity: interpolate(
                    frame,
                    [i * 3, i * 3 + 14],
                    [0, 1],
                    {
                      easing: standardEase,
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  ),
                }}
              >
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    color: colors.subtle,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: fontSans,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${paletteShowcase.length}, 1fr)`,
              gap: 8,
            }}
          >
            {paletteShowcase.map((swatch, i) => (
              <div
                key={swatch.name}
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${colors.border}`,
                  opacity: interpolate(
                    frame,
                    [20 + i * 4, 34 + i * 4],
                    [0, 1],
                    {
                      easing: standardEase,
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  ),
                }}
              >
                <div style={{ height: 56, backgroundColor: swatch.hex }} />
                <div
                  style={{
                    padding: "8px 10px",
                    backgroundColor: colors.surface100,
                    fontFamily: fontMono,
                    fontSize: 10,
                    color: colors.muted,
                  }}
                >
                  {swatch.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
}

function SceneFinale() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cycle = frame % Math.round(1.4 * fps);
  const pulseOpacity = interpolate(
    cycle,
    [0, Math.round(0.7 * fps), Math.round(1.4 * fps)],
    [1, 0.35, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const hero = interpolate(frame, [0, msToFrames(500, fps)], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(frame, [0, msToFrames(500, fps)], [24, 0], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <AmbientGlow />
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 64,
        }}
      >
        <div
          style={{
            opacity: hero,
            transform: `translateY(${rise}px)`,
            textAlign: "center",
          }}
        >
          <Img
            src={staticFile("app-icon.svg")}
            style={{
              width: 112,
              height: 112,
              borderRadius: 24,
              margin: "0 auto 28px",
              boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${colors.borderStrong}`,
            }}
          />
          <StaticLockup scale={0.95} />
          <p
            style={{
              marginTop: 20,
              fontFamily: fontSans,
              fontSize: 22,
              color: colors.muted,
            }}
          >
            From any URL to a build-ready system
            <span style={{ color: colors.accent }}>.</span>
          </p>
          <p
            style={{
              marginTop: 8,
              fontFamily: fontMono,
              fontSize: 18,
              color: colors.accent,
            }}
          >
            www.getdesign.app
          </p>
        </div>

        <div
          style={{
            marginTop: 48,
            width: "min(840px, 90%)",
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface100,
            padding: "28px 32px",
            opacity: interpolate(
              frame,
              [msToFrames(350, fps), msToFrames(750, fps)],
              [0, 1],
              {
                easing: standardEase,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: colors.accent,
                opacity: pulseOpacity,
              }}
            />
            <span
              style={{
                fontFamily: fontSans,
                fontSize: 14,
                color: colors.muted,
              }}
            >
              CLI · SDK · API · Skill
            </span>
          </div>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 22,
              color: colors.accent,
              wordBreak: "break-all",
            }}
          >
            npx @getdesign/cli https://linear.app
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: fontSans,
              fontSize: 14,
              lineHeight: 1.5,
              color: colors.muted,
            }}
          >
            Grounded in real CSS, delivered as a living design.md.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Sequence durationInFrames={SCENE_AUDIO_FRAMES[0]}>
        <SceneLogoIntro />
        <Audio src={staticFile("voiceover/launch/01-logo.mp3")} />
      </Sequence>
      <Sequence
        from={SCENE_FROM_FRAMES[1]}
        durationInFrames={SCENE_AUDIO_FRAMES[1]}
      >
        <SceneWhatIsIt />
        <Audio src={staticFile("voiceover/launch/02-what-is-it.mp3")} />
      </Sequence>
      <Sequence
        from={SCENE_FROM_FRAMES[2]}
        durationInFrames={SCENE_AUDIO_FRAMES[2]}
      >
        <SceneHowItWorksDashboard />
        <Audio src={staticFile("voiceover/launch/03-how-it-works.mp3")} />
      </Sequence>
      <Sequence
        from={SCENE_FROM_FRAMES[3]}
        durationInFrames={SCENE_AUDIO_FRAMES[3]}
      >
        <SceneDeliverables />
        <Audio src={staticFile("voiceover/launch/04-deliverables.mp3")} />
      </Sequence>
      <Sequence
        from={SCENE_FROM_FRAMES[4]}
        durationInFrames={SCENE_AUDIO_FRAMES[4]}
      >
        <SceneArchitectureStack />
        <Audio src={staticFile("voiceover/launch/05-architecture.mp3")} />
      </Sequence>
      <Sequence
        from={SCENE_FROM_FRAMES[5]}
        durationInFrames={SCENE_AUDIO_FRAMES[5]}
      >
        <SceneFinale />
        <Audio src={staticFile("voiceover/launch/06-finale.mp3")} />
      </Sequence>
      <CaptionLayer />
    </AbsoluteFill>
  );
};
