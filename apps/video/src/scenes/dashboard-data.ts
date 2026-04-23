/**
 * Mirrors `apps/web/app/_components/interactive-demo/constants.tsx` + site.ts
 * Copy is aligned with `architecture.md` (agent, API, SDK, Daytona, etc.).
 */

export type DemoSite = {
  id: string;
  url: string;
  brandColor: string;
  theme: string;
  palette: string[];
  fonts: [string, string];
  sections: string[];
};

export const DEMO_SITES: DemoSite[] = [
  {
    id: "cursor",
    url: "cursor.com",
    brandColor: "#ededed",
    theme: "Warm minimalism meets code-editor elegance",
    palette: ["#f2f1ed", "#26251e", "#f54e00", "#cf2d56"],
    fonts: ["CursorGothic Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "components"],
  },
  {
    id: "linear",
    url: "linear.app",
    brandColor: "#5E6AD2",
    theme: "Hyper-precise dark UI with signal-gradient accents",
    palette: ["#0a0a0b", "#e6e6e8", "#5e6ad2", "#ff4d6d"],
    fonts: ["Inter Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "interaction"],
  },
  {
    id: "stripe",
    url: "stripe.com",
    brandColor: "#635BFF",
    theme: "Bright, confident, dense information architecture",
    palette: ["#ffffff", "#0a2540", "#635bff", "#00d4ff"],
    fonts: ["Sohne", "Sohne Mono"],
    sections: ["visualTheme", "palette", "typography", "layout"],
  },
];

export type SurfaceId = "web" | "api" | "cli" | "sdk" | "skill";

export const SURFACE_NAV: Array<{ id: SurfaceId; label: string }> = [
  { id: "web", label: "web" },
  { id: "api", label: "api" },
  { id: "cli", label: "cli" },
  { id: "sdk", label: "sdk" },
  { id: "skill", label: "skill" },
];

export function chromeLabel(surface: SurfaceId, siteUrl: string): string {
  switch (surface) {
    case "web":
      return "getdesign.app";
    case "api":
      return `api.getdesign.app/?url=${siteUrl}`;
    case "cli":
      return "~ · zsh";
    case "sdk":
      return "app.ts · @getdesign/sdk";
    case "skill":
      return "claude-code · skill: getdesign";
    default:
      return "getdesign.app";
  }
}

/** Longer explanations for the video — sourced from architecture.md + marketing copy. */
export const SURFACE_ARCHITECTURE: Record<
  SurfaceId,
  { headline: string; bullets: string[] }
> = {
  web: {
    headline: "Web - chat in, design system out",
    bullets: [
      "A chat request kicks off the run while the artifact panel fills with a live design.md.",
      "Same coordinator, same output contract, just wrapped in a polished product surface.",
    ],
  },
  api: {
    headline: "API - one request, production markdown",
    bullets: [
      "Hit a single endpoint and get back the full design.md as markdown.",
      "The crawl, capture, extract, and synthesize graph is identical to the web flow.",
    ],
  },
  cli: {
    headline: "CLI - fast one-shot or REPL",
    bullets: [
      "Run a single command for stdout, or stay in a terminal loop for follow-up prompts.",
      "Great for product teams, developers, and fast handoff moments in the shell.",
    ],
  },
  sdk: {
    headline: "SDK - typed stream for your app",
    bullets: [
      "Use a typed client to stream phases, screenshots, and markdown deltas into your own workflow.",
      "Built on fetch and Web Streams, so it fits Node, Bun, Deno, Workers, and Edge runtimes.",
    ],
  },
  skill: {
    headline: "Skill - same core inside the IDE",
    bullets: [
      "Install it once and let your IDE agent use its own browser, shell, and repo context.",
      "Different transport, same design.md shape, which keeps the result predictable everywhere.",
    ],
  },
};

/** Agent pipeline copy for optional callouts (architecture §4). */
export const AGENT_LAYERS = [
  "CrawlerAgent - HTML, CSS, fonts, and computed styles from the real page.",
  "VisualAgent - Daytona plus Chromium for hero shots and full-page capture.",
  "TokenExtractor - color, type, spacing, radii, and motion tokens into typed data.",
  "Synthesizer - deterministic render from structured tokens into nine-section design.md.",
] as const;

export const DEFAULT_DEMO_SITE_ID = "stripe";
