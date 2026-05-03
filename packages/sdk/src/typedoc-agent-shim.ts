/**
 * Stand-in for `@getdesign/agent` used only when generating SDK API docs (TypeDoc).
 *
 * Traversing the real agent pulls in Daytona, crawler, renderer, AI SDK internals, etc.
 * Some CI environments fail while Starlight runs TypeDoc during `astro:config:setup`; Astro
 * may surface that as “Browser APIs are not available…”. Mapping `@getdesign/agent` to this
 * file from `tsconfig.typedoc.json` keeps the SDK program type-safe without that graph.
 *
 * Shapes below mirror the parts of `RunDesignEvent` that `publicEvent()` in `index.ts` reads.
 * This file is compile-only for the real package (see `typedoc-agent-shim.ts` in tsc emit).
 */
import type { DesignDoc, DesignTokens } from "@getdesign/types";

/** Minimal crawl payload shape used by SDK progress mapping. */
export type CrawlSiteResultShim = {
  siteName: string;
  stylesheets: unknown[];
};

/** Minimal capture phase event (see `@getdesign/tools` CapturePhaseEvent). */
export type CapturePhaseEventShim = {
  phase: string;
  status: string;
  detail?: string;
  durationMs?: number;
};

/** Minimal visual outcome (see `@getdesign/agent` VisualResult). */
export type VisualResultShim = {
  status: string;
  reason?: string;
};

export type VisualRequirement =
  | "require"
  | "text_only_fallback"
  | "skip_silently";

export type RunDesignCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

export type RunDesignOptions = {
  model?: unknown;
  siteName?: string;
  visualRequirement?: VisualRequirement;
  credentials?: RunDesignCredentials;
  installI18nFonts?: boolean;
  measurementMode?: "cdp" | "visual" | "auto";
  onPhase?: (event: RunDesignEvent) => void | Promise<void>;
};

export type RunDesignEvent =
  | { phase: "crawl"; status: "start" }
  | { phase: "crawl"; status: "ok"; crawl: CrawlSiteResultShim }
  | { phase: "capture"; event: CapturePhaseEventShim }
  | { phase: "visual"; status: "start" }
  | { phase: "visual"; status: "ok"; visual: VisualResultShim }
  | { phase: "describe"; status: "start" | "ok"; detail?: string }
  | { phase: "extract"; status: "start" }
  | { phase: "extract"; status: "ok"; tokens: DesignTokens }
  | { phase: "synthesize"; status: "start" }
  | { phase: "synthesize"; status: "ok"; doc: DesignDoc }
  | { phase: "render"; status: "start" }
  | { phase: "render"; status: "ok"; markdown: string };

export type RunDesignResult = {
  url: string;
  markdown: string;
  doc: DesignDoc;
  tokens: DesignTokens;
  crawl: CrawlSiteResultShim;
  visual: VisualResultShim;
  visualDescription: string | null;
  tiles: number;
  mode: "visual" | "text_only";
};

export class RunDesignError extends Error {
  readonly code: "capture_failed" = "capture_failed";
  readonly visual: unknown;

  constructor(visual: unknown) {
    const v = visual as { status?: string; reason?: string } | null;
    const reason =
      v && (v.status === "failed" || v.status === "skipped")
        ? (v.reason ?? "Visual capture unavailable.")
        : "Visual capture unavailable.";
    super(reason);
    this.name = "RunDesignError";
    this.visual = visual;
  }
}

export async function runDesign(
  _url: string,
  _options?: RunDesignOptions,
): Promise<RunDesignResult> {
  throw new Error("typedoc-agent-shim: runDesign is not executable in docs builds");
}
