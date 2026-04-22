import { AbsoluteFill } from "remotion";

import { colors } from "../design-tokens";

const dashedLine = {
  backgroundImage:
    "linear-gradient(to right, rgba(237,237,238,0.12) 50%, transparent 50%)",
  backgroundSize: "8px 1px",
  backgroundRepeat: "repeat-x",
  backgroundPosition: "left bottom",
} as const;

export function AmbientGlow() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(900px 520px at 88% 8%, ${colors.accentGlow}, transparent 55%)`,
        pointerEvents: "none",
      }}
    />
  );
}

export function DashedBottomRule() {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 64,
        height: 1,
        ...dashedLine,
        opacity: 0.9,
      }}
    />
  );
}

export function SceneBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <AmbientGlow />
      {children}
    </AbsoluteFill>
  );
}
