import { interpolate, useVideoConfig } from "remotion";

import {
  LOGO_BRACKET_DASH,
  colors,
  msToFrames,
  standardEase,
} from "../design-tokens";
import { fontMono, fontSans } from "../fonts";

type AnimatedLockupProps = {
  frame: number;
  /** Scale multiplier on xl-sized mark (72px base height). */
  scale?: number;
};

/**
 * Frame-for-frame match of `.gd-logo.gd-logo-animate` in `apps/web/app/globals.css`:
 * left bracket 520ms after 60ms, right 520ms after 140ms, "md" 420ms after 420ms.
 */
export function AnimatedLockup({ frame, scale = 1 }: AnimatedLockupProps) {
  const { fps } = useVideoConfig();

  const l0 = msToFrames(60, fps);
  const l1 = l0 + msToFrames(520, fps);
  const leftDash = interpolate(frame, [l0, l1], [LOGO_BRACKET_DASH, 0], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const r0 = msToFrames(140, fps);
  const r1 = r0 + msToFrames(520, fps);
  const rightDash = interpolate(frame, [r0, r1], [LOGO_BRACKET_DASH, 0], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const m0 = msToFrames(420, fps);
  const m1 = m0 + msToFrames(420, fps);
  const mdOpacity = interpolate(frame, [m0, m1], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mdY = interpolate(frame, [m0, m1], [2, 0], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const w0 = m1 + msToFrames(100, fps);
  const w1 = w0 + msToFrames(400, fps);
  const wordOpacity = interpolate(frame, [w0, w1], [0, 1], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wordY = interpolate(frame, [w0, w1], [12, 0], {
    easing: standardEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const markHeight = 72 * scale;
  const markWidth = Math.round(markHeight * 1.5);
  const wordPx = 36 * scale;
  const gap = 16 * scale;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        fontFamily: fontSans,
      }}
    >
      <svg
        viewBox="0 0 60 40"
        width={markWidth}
        height={markHeight}
        fill="none"
        style={{ color: colors.foreground }}
      >
        <path
          d="M11 5 L4 5 L4 35 L11 35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeDasharray={LOGO_BRACKET_DASH}
          strokeDashoffset={leftDash}
        />
        <path
          d="M49 5 L56 5 L56 35 L49 35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeDasharray={LOGO_BRACKET_DASH}
          strokeDashoffset={rightDash}
        />
        <g
          style={{
            opacity: mdOpacity,
            transform: `translate(0px, ${mdY}px)`,
          }}
        >
          <text
            x="30"
            y="28"
            textAnchor="middle"
            fontFamily={fontMono}
            fontSize="20"
            fontWeight={600}
            letterSpacing="-1"
            fill={colors.accent}
          >
            md
          </text>
        </g>
      </svg>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          fontWeight: 500,
          letterSpacing: "-0.035em",
          fontSize: wordPx,
          lineHeight: 1.04,
          opacity: wordOpacity,
          transform: `translateY(${wordY}px)`,
        }}
      >
        <span style={{ color: colors.subtle }}>get</span>
        <span style={{ color: colors.foreground }}>design</span>
        <span style={{ color: colors.accent }}>.</span>
      </span>
    </div>
  );
}

/** Static lockup for scenes after the intro (no bracket draw). */
export function StaticLockup({ scale = 1 }: { scale?: number }) {
  const markHeight = 72 * scale;
  const markWidth = Math.round(markHeight * 1.5);
  const wordPx = 36 * scale;
  const gap = 16 * scale;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        fontFamily: fontSans,
      }}
    >
      <svg
        viewBox="0 0 60 40"
        width={markWidth}
        height={markHeight}
        fill="none"
        style={{ color: colors.foreground }}
      >
        <path
          d="M11 5 L4 5 L4 35 L11 35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path
          d="M49 5 L56 5 L56 35 L49 35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <text
          x="30"
          y="28"
          textAnchor="middle"
          fontFamily={fontMono}
          fontSize="20"
          fontWeight={600}
          letterSpacing="-1"
          fill={colors.accent}
        >
          md
        </text>
      </svg>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          fontWeight: 500,
          letterSpacing: "-0.035em",
          fontSize: wordPx,
          lineHeight: 1.04,
        }}
      >
        <span style={{ color: colors.subtle }}>get</span>
        <span style={{ color: colors.foreground }}>design</span>
        <span style={{ color: colors.accent }}>.</span>
      </span>
    </div>
  );
}
