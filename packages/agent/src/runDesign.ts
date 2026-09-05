import { renderDesignMd } from "@getdesign/tools/render";

import type { CrawlSiteResult } from "@getdesign/tools";
import type {
  CapturePhaseEvent,
  ScreenshotArtifact,
} from "@getdesign/tools/daytona";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import { runCrawl } from "./agents/crawler.js";
import { runDescribe } from "./agents/describe.js";
import { runExtractTokens } from "./agents/tokenExtractor.js";
import { runSynthesize } from "./agents/synthesizer.js";
import { runVisual, type VisualResult } from "./agents/visual.js";
import { resolveModel } from "./model.js";
import type { LanguageModel } from "ai";

export type RunDesignPhase =
  | "crawl"
  | "capture"
  | "visual"
  | "describe"
  | "extract"
  | "synthesize"
  | "render";

export type RunDesignEvent =
  | { phase: "crawl"; status: "start" }
  | { phase: "crawl"; status: "ok"; crawl: CrawlSiteResult }
  | { phase: "capture"; event: CapturePhaseEvent }
  | { phase: "visual"; status: "start" }
  | { phase: "visual"; status: "ok"; visual: VisualResult }
  | { phase: "describe"; status: "start" | "ok"; detail?: string }
  | { phase: "extract"; status: "start" }
  | { phase: "extract"; status: "ok"; tokens: DesignTokens }
  | { phase: "synthesize"; status: "start" }
  | { phase: "synthesize"; status: "ok"; doc: DesignDoc }
  | { phase: "render"; status: "start" }
  | { phase: "render"; status: "ok"; markdown: string };

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
  siteName?: string;
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
   * Long-form markdown walkthrough of the rendered page, produced by the
   * VisualDescriber sub-agent from the full ordered tile sequence. `null`
   * when capture was skipped or text-only mode forced no tiles.
   */
  visualDescription: string | null;
  /** Number of tiles captured (0 when capture was skipped). */
  tiles: number;
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

function tilesAsArtifacts(visual: VisualResult): ScreenshotArtifact[] {
  if (visual.status !== "captured") return [];
  return visual.tiles.map((tile) => ({
    imageBase64: tile.pngBase64,
    width: tile.width,
    height: tile.height,
    format: "png",
  }));
}

/**
 * Imperative one-shot driver: crawl -> capture -> describe -> extract ->
 * synthesize -> render. Hosted callers should pass `credentials` with the
 * authenticated user's Daytona/OpenAI keys; CLI direct mode should leave
 * credentials empty so the env-based fallback applies.
 */
export async function runDesign(
  url: string,
  options: RunDesignOptions = {},
): Promise<RunDesignResult> {
  const visualRequirement = options.visualRequirement ?? "require";
  const credentials = options.credentials;
  const model =
    options.model ?? resolveModel({ apiKey: credentials?.openaiApiKey });

  await options.onPhase?.({ phase: "crawl", status: "start" });
  const crawled = await runCrawl({ url });
  const crawl = options.siteName?.trim()
    ? { ...crawled, siteName: options.siteName.trim() }
    : crawled;
  await options.onPhase?.({ phase: "crawl", status: "ok", crawl });

  await options.onPhase?.({ phase: "visual", status: "start" });
  const visual: VisualResult =
    visualRequirement === "text_only_fallback"
      ? {
          status: "skipped",
          reason: "Text-only mode was explicitly requested.",
        }
      : await runVisual(
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
  await options.onPhase?.({ phase: "visual", status: "ok", visual });

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

  const tileArtifacts = tilesAsArtifacts(visual);

  let visualDescription: string | null = null;
  if (visual.status === "captured" && tileArtifacts.length > 0) {
    await options.onPhase?.({
      phase: "describe",
      status: "start",
      detail: `${tileArtifacts.length} tile${tileArtifacts.length === 1 ? "" : "s"}`,
    });
    const describe = await runDescribe({
      sourceUrl: crawl.sourceUrl,
      siteName: crawl.siteName,
      tiles: tileArtifacts,
      documentHeight: visual.documentHeight,
      documentWidth: visual.documentWidth,
      viewport: visual.viewport,
      model,
    });
    visualDescription = describe.description;
    const wordCount = visualDescription.split(/\s+/).filter(Boolean).length;
    await options.onPhase?.({
      phase: "describe",
      status: "ok",
      detail: `${wordCount} words`,
    });
  }

  await options.onPhase?.({ phase: "extract", status: "start" });
  const tokens = runExtractTokens(crawl);
  await options.onPhase?.({ phase: "extract", status: "ok", tokens });

  await options.onPhase?.({ phase: "synthesize", status: "start" });
  const { doc } = await runSynthesize({
    sourceUrl: crawl.sourceUrl,
    siteName: crawl.siteName,
    tokens,
    tiles: tileArtifacts.length > 0 ? tileArtifacts : undefined,
    visualDescription: visualDescription ?? undefined,
    crawlNotes: crawl.notes,
    model,
  });
  await options.onPhase?.({ phase: "synthesize", status: "ok", doc });

  await options.onPhase?.({ phase: "render", status: "start" });
  const baseMarkdown = renderDesignMd(doc);
  const markdown =
    mode === "text_only" ? prependTextOnlyBanner(baseMarkdown) : baseMarkdown;
  await options.onPhase?.({ phase: "render", status: "ok", markdown });

  return {
    url: crawl.sourceUrl,
    markdown,
    doc,
    tokens,
    crawl,
    visual,
    visualDescription,
    tiles: tileArtifacts.length,
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
