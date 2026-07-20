/**
 * Re-exports shared demo constants from `@getdesign/content`, plus
 * video-only architecture copy for Remotion scenes.
 */

import {
  DEMO_SITES,
  DEFAULT_DEMO_SITE_ID,
  SURFACE_META,
  chromeLabel,
  type DemoSite,
  type SurfaceId,
} from "@getdesign/content";

export type { DemoSite, SurfaceId };
export { DEMO_SITES, DEFAULT_DEMO_SITE_ID, chromeLabel };

export const SURFACE_NAV: Array<{ id: SurfaceId; label: string }> =
  SURFACE_META.map(({ id, label }) => ({ id, label }));

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
