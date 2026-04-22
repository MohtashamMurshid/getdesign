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
    headline: "Web — streaming chat + artifact panel",
    bullets: [
      "Next.js chat posts to /api/chat; ai-elements render tools, reasoning, and sources.",
      "The same CoordinatorAgent streams UIMessage parts while design.md grows in the Artifact panel.",
    ],
  },
  api: {
    headline: "API — one GET, full markdown",
    bullets: [
      "GET api.getdesign.app/?url=… returns text/markdown (final design.md). Read-only, no auth in v1.",
      "Waits for crawl → Daytona viewport/full-page capture → token extract → synthesize, same graph as web.",
    ],
  },
  cli: {
    headline: "CLI — terminal & REPL",
    bullets: [
      "npx @getdesign/cli <url> for one-shot stdout; bare npx opens an OpenTUI REPL on the same stream.",
      "Can run the agent locally when Daytona + gateway keys are set, or call the hosted API.",
    ],
  },
  sdk: {
    headline: "SDK — typed client, any runtime",
    bullets: [
      "getDesign(url) returns { markdown, doc }; streamDesign(url) async-iterates phase / screenshot / delta events.",
      "Pure fetch + Web Streams — Node, Bun, Deno, Workers, Edge — thin wrapper over the HTTP API.",
    ],
  },
  skill: {
    headline: "Skill — portable SKILL.md",
    bullets: [
      "Install once; runs inside Claude Code, Codex, Cursor with the host agent’s own browser/tools.",
      "Fifth surface: same design.md output pattern, different transport (prompt + skill bundle).",
    ],
  },
};

/** Agent pipeline copy for optional callouts (architecture §4). */
export const AGENT_LAYERS = [
  "CrawlerAgent — fetch HTML/CSS, fonts, computed styles (Bun, not sandbox).",
  "VisualAgent — Daytona snapshot, Chromium kiosk, compressed screenshots, scroll-and-stitch full page.",
  "TokenExtractorAgent — colors, type, spacing, radii, shadows → DesignTokens (Zod).",
  "SynthesizerAgent — DesignDoc JSON → deterministic render → nine-section design.md.",
] as const;

export const DEFAULT_DEMO_SITE_ID = "stripe";
