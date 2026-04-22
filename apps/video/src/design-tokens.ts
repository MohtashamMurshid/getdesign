import { Easing } from "remotion";

/**
 * Mirrors `apps/web/app/design/_components/design-data.ts` fallbacks
 * and `apps/web/app/globals.css` — single source of truth for the launch film.
 */
export const standardEase = Easing.bezier(0.2, 0.7, 0.2, 1);

export const msToFrames = (ms: number, fps: number) =>
  Math.round((ms / 1000) * fps);

/** Same stroke-dash setup as `.gd-logo .gd-bracket` in `apps/web/app/globals.css` */
export const LOGO_BRACKET_DASH = 80;

export const colors = {
  background: "#0a0a0b",
  surface100: "#101012",
  surface200: "#141418",
  surface300: "#1a1a20",
  foreground: "#ededee",
  muted: "rgba(237, 237, 238, 0.6)",
  subtle: "rgba(237, 237, 238, 0.38)",
  faint: "rgba(237, 237, 238, 0.12)",
  border: "rgba(255, 255, 255, 0.07)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  accent: "#a3e635",
  accentDim: "#65a30d",
  accentGlow: "rgba(163, 230, 53, 0.18)",
} as const;

export const paletteShowcase = [
  { name: "Background", hex: colors.background },
  { name: "Surface 100", hex: colors.surface100 },
  { name: "Foreground", hex: colors.foreground },
  { name: "Accent", hex: colors.accent },
] as const;
