export const PALETTE = [
  {
    name: "Background",
    cssVar: "--background",
    fallback: "#0a0a0b",
    role: "Page canvas",
  },
  {
    name: "Surface 100",
    cssVar: "--surface-100",
    fallback: "#101012",
    role: "Cards, tiles",
  },
  {
    name: "Surface 200",
    cssVar: "--surface-200",
    fallback: "#141418",
    role: "Hover, inputs",
  },
  {
    name: "Surface 300",
    cssVar: "--surface-300",
    fallback: "#1a1a20",
    role: "Elevated",
  },
  {
    name: "Foreground",
    cssVar: "--foreground",
    fallback: "#ededee",
    role: "Primary text",
  },
  {
    name: "Muted",
    cssVar: "--muted",
    fallback: "rgba(237,237,238,0.6)",
    role: "Body copy",
  },
  {
    name: "Subtle",
    cssVar: "--subtle",
    fallback: "rgba(237,237,238,0.38)",
    role: "Meta, labels",
  },
  {
    name: "Faint",
    cssVar: "--faint",
    fallback: "rgba(237,237,238,0.12)",
    role: "Dashed rails",
  },
  {
    name: "Border",
    cssVar: "--border",
    fallback: "rgba(255,255,255,0.07)",
    role: "Hairlines",
  },
  {
    name: "Border strong",
    cssVar: "--border-strong",
    fallback: "rgba(255,255,255,0.14)",
    role: "Focus, chips",
  },
  {
    name: "Accent",
    cssVar: "--accent",
    fallback: "#a3e635",
    role: "Primary accent",
  },
  {
    name: "Accent dim",
    cssVar: "--accent-dim",
    fallback: "#65a30d",
    role: "Accent pressed",
  },
  {
    name: "Accent glow",
    cssVar: "--accent-glow",
    fallback: "rgba(163,230,53,0.18)",
    role: "Halos, auras",
  },
  {
    name: "Danger",
    cssVar: "--danger",
    fallback: "#f87171",
    role: "Errors only",
  },
] as const;

export const SPACES = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64] as const;

export const RADII = [
  { name: "sm", value: "4px" },
  { name: "md", value: "8px" },
  { name: "lg", value: "12px" },
  { name: "xl", value: "16px" },
  { name: "full", value: "9999px" },
] as const;

export const EASINGS = [
  {
    name: "standard",
    curve: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    note: "UI transitions, nav, hovers. ~220ms.",
  },
  {
    name: "draw-on",
    curve: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    note: "Logo + brackets. 520ms stagger 80ms.",
  },
  {
    name: "pulse",
    curve: "ease-in-out",
    note: "Status dots. 1.4s loop, opacity 1 → 0.35.",
  },
] as const;

export const VOICE = [
  {
    do: "The design system for any URL.",
    dont: "The revolutionary AI-powered design platform.",
  },
  {
    do: "Paste a URL. Get a design.md.",
    dont: "Unlock the power of intelligent design extraction.",
  },
  {
    do: "Five surfaces, one agent.",
    dont: "Our robust multi-platform AI ecosystem.",
  },
  {
    do: "Grounded in the site's actual CSS.",
    dont: "Leveraging cutting-edge web analysis technology.",
  },
] as const;
