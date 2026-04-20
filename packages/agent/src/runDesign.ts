import { renderDesignMd } from "@getdesign/tools/render";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import { runCrawl } from "./agents/crawler";
import { runExtractTokens } from "./agents/tokenExtractor";
import { runSynthesize } from "./agents/synthesizer";
import { runVisual, type VisualResult } from "./agents/visual";
import { resolveModel } from "./model";
import type { LanguageModel } from "ai";

export type RunDesignPhase =
  | "crawl"
  | "visual"
  | "extract"
  | "synthesize"
  | "render";

export type RunDesignEvent =
  | { phase: "crawl"; crawl: CrawlSiteResult }
  | { phase: "visual"; visual: VisualResult }
  | { phase: "extract"; tokens: DesignTokens }
  | { phase: "synthesize"; doc: DesignDoc }
  | { phase: "render"; markdown: string };

export type RunDesignOptions = {
  model?: LanguageModel;
  captureFullPage?: boolean;
  snapshot?: string;
  onPhase?: (event: RunDesignEvent) => void | Promise<void>;
};

export type RunDesignResult = {
  url: string;
  markdown: string;
  doc: DesignDoc;
  tokens: DesignTokens;
  crawl: CrawlSiteResult;
  visual: VisualResult;
};

/**
 * Imperative one-shot driver: crawl -> visual -> extract -> synthesize -> render.
 * This is the path used by the CLI smoke script and (eventually) the HTTP API.
 * The `ToolLoopAgent` coordinator is offered alongside for streaming/UIMessage
 * consumers that need a `delegate`-style API.
 */
export async function runDesign(
  url: string,
  options: RunDesignOptions = {},
): Promise<RunDesignResult> {
  const model = options.model ?? resolveModel();

  const crawl = await runCrawl({ url });
  await options.onPhase?.({ phase: "crawl", crawl });

  const visual = await runVisual({
    url: crawl.sourceUrl,
    snapshot: options.snapshot,
    captureFullPage: options.captureFullPage ?? false,
  });
  await options.onPhase?.({ phase: "visual", visual });

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

  const markdown = renderDesignMd(doc);
  await options.onPhase?.({ phase: "render", markdown });

  return {
    url: crawl.sourceUrl,
    markdown,
    doc,
    tokens,
    crawl,
    visual,
  };
}
