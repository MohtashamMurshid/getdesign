import { renderDesignMd } from "@getdesign/tools/render";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { CapturePhaseEvent } from "@getdesign/tools/daytona";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import { runCrawl } from "./agents/crawler";
import { runExtractTokens } from "./agents/tokenExtractor";
import { runSynthesize } from "./agents/synthesizer";
import { runVisual, type VisualResult } from "./agents/visual";
import { resolveModel } from "./model";
import type { LanguageModel } from "ai";

export type RunDesignPhase =
  | "crawl"
  | "capture"
  | "visual"
  | "extract"
  | "synthesize"
  | "render";

export type RunDesignEvent =
  | { phase: "crawl"; crawl: CrawlSiteResult }
  | { phase: "capture"; event: CapturePhaseEvent }
  | { phase: "visual"; visual: VisualResult }
  | { phase: "extract"; tokens: DesignTokens }
  | { phase: "synthesize"; doc: DesignDoc }
  | { phase: "render"; markdown: string };

/**
 * How the run should react when the visual capture path is unavailable
 * (e.g. capture failure or missing key).
 *
 * - `"require"`: fail with `RunDesignError` so the caller can prompt the
 *   user before retrying as text-only. Default for hosted runs.
 * - `"text_only_fallback"`: continue without screenshots and mark the
 *   run as `text_only`. Use only after the user has explicitly accepted
 *   the loss of visual capture.
 * - `"skip_silently"`: legacy. Continue without screenshots and without
 *   marking the run as text-only. Reserved for local development.
 */
export type VisualRequirement =
  | "require"
  | "text_only_fallback"
  | "skip_silently";

export type RunDesignCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

export type RunDesignOptions = {
  model?: LanguageModel;
  visualRequirement?: VisualRequirement;
  credentials?: RunDesignCredentials;
  /** Force or disable the i18n font install. Auto-detected from URL TLD when omitted. */
  installI18nFonts?: boolean;
  /** Override measurement strategy. `auto` (default) tries CDP first then visual-stability. */
  measurementMode?: "cdp" | "visual" | "auto";
  onPhase?: (event: RunDesignEvent) => void | Promise<void>;
};

export type RunDesignResult = {
  url: string;
  markdown: string;
  doc: DesignDoc;
  tokens: DesignTokens;
  crawl: CrawlSiteResult;
  visual: VisualResult;
  /**
   * `"visual"` when a hero capture was used, `"text_only"` when capture was
   * unavailable and the user accepted a degraded run.
   */
  mode: "visual" | "text_only";
};

export class RunDesignError extends Error {
  readonly code: "capture_failed";
  readonly visual: VisualResult;

  constructor(visual: VisualResult) {
    const reason =
      visual.status === "failed" || visual.status === "skipped"
        ? visual.reason
        : "Visual capture unavailable.";
    super(reason);
    this.name = "RunDesignError";
    this.code = "capture_failed";
    this.visual = visual;
  }
}

/**
 * Imperative one-shot driver: crawl -> capture -> extract -> synthesize ->
 * render. Hosted callers should pass `credentials` with the authenticated
 * user's Daytona/OpenAI keys; CLI direct mode should leave credentials
 * empty so the env-based fallback applies.
 */
export async function runDesign(
  url: string,
  options: RunDesignOptions = {},
): Promise<RunDesignResult> {
  const visualRequirement = options.visualRequirement ?? "require";
  const credentials = options.credentials;
  const model =
    options.model ?? resolveModel({ apiKey: credentials?.openaiApiKey });

  const crawl = await runCrawl({ url });
  await options.onPhase?.({ phase: "crawl", crawl });

  const visual = await runVisual(
    {
      url: crawl.sourceUrl,
      installI18nFonts: options.installI18nFonts,
      measurementMode: options.measurementMode,
    },
    {
      daytonaApiKey: credentials?.daytonaApiKey,
      onCapturePhase: (event) => {
        void options.onPhase?.({ phase: "capture", event });
      },
    },
  );
  await options.onPhase?.({ phase: "visual", visual });

  if (visual.status === "failed") {
    if (visualRequirement === "require") {
      throw new RunDesignError(visual);
    }
  }

  const mode: RunDesignResult["mode"] =
    visual.status === "captured"
      ? "visual"
      : visualRequirement === "skip_silently"
        ? "visual"
        : "text_only";

  const tokens = runExtractTokens(crawl);
  await options.onPhase?.({ phase: "extract", tokens });

  const hero = visual.status === "captured" ? visual.hero : undefined;

  const { doc } = await runSynthesize({
    sourceUrl: crawl.sourceUrl,
    siteName: crawl.siteName,
    tokens,
    hero,
    crawlNotes: crawl.notes,
    model,
  });
  await options.onPhase?.({ phase: "synthesize", doc });

  const baseMarkdown = renderDesignMd(doc);
  const markdown =
    mode === "text_only" ? prependTextOnlyBanner(baseMarkdown) : baseMarkdown;
  await options.onPhase?.({ phase: "render", markdown });

  return {
    url: crawl.sourceUrl,
    markdown,
    doc,
    tokens,
    crawl,
    visual,
    mode,
  };
}

function prependTextOnlyBanner(markdown: string): string {
  const banner = [
    "> **Note:** This design.md was produced in text-only mode. The Daytona-based full landing page capture was unavailable for this run, so visual sections are derived from CSS tokens alone and may not reflect imagery, layout depth, or interaction polish from the live site.",
    "",
  ].join("\n");
  return `${banner}\n${markdown}`;
}
