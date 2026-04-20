import { ToolLoopAgent, tool, stepCountIs, type LanguageModel } from "ai";
import { z } from "zod";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { DesignTokens } from "@getdesign/types";

import { createCrawlerTool } from "./crawler";
import { createTokenExtractorTool } from "./tokenExtractor";
import { createVisualTool, type VisualResult } from "./visual";
import { runSynthesize } from "./synthesizer";
import { resolveModel } from "../model";

const COORDINATOR_INSTRUCTIONS = `You are the Coordinator for getdesign. Given a URL, run the pipeline exactly once in this order:

1. Call the \`crawl\` tool with the URL to fetch HTML + CSS.
2. Call the \`screenshot\` tool with the same URL (it may report status "skipped" when the sandbox is unavailable; that is fine).
3. Call the \`extractTokens\` tool with the source URL to produce DesignTokens from the crawl.
4. Call the \`synthesize\` tool with the source URL to produce a DesignDoc and its markdown.

Do not skip steps and do not call any tool twice. After \`synthesize\` returns, reply with a short confirmation and stop.`;

/**
 * Shared run context used to thread crawl/tokens/visual state between the
 * coordinator's tools without pumping them through the LLM's context window.
 */
export type CoordinatorContext = {
  crawl?: CrawlSiteResult;
  tokens?: DesignTokens;
  visual?: VisualResult;
  markdown?: string;
};

export type CreateCoordinatorOptions = {
  model?: LanguageModel;
  maxSteps?: number;
  context?: CoordinatorContext;
};

/**
 * Build a fresh CoordinatorAgent bound to a shared context. Each call creates a
 * new agent + context pair; do not share a single instance across runs since
 * tool results mutate the context.
 */
export function createCoordinator(options: CreateCoordinatorOptions = {}) {
  const context: CoordinatorContext = options.context ?? {};
  const model = options.model ?? resolveModel();

  const crawl = createCrawlerTool(context);
  const screenshot = createVisualTool(context);
  const extractTokens = createTokenExtractorTool(context);

  const synthesize = tool({
    description:
      "Turn the extracted DesignTokens (+ optional hero screenshot) into a validated DesignDoc. Must run after extractTokens.",
    inputSchema: z.object({
      sourceUrl: z.string().url(),
    }),
    execute: async ({ sourceUrl }) => {
      if (!context.tokens || !context.crawl) {
        throw new Error(
          "synthesize requires crawl + extractTokens to have completed first.",
        );
      }

      const hero =
        context.visual?.status === "captured" ? context.visual.hero : undefined;

      const { doc } = await runSynthesize({
        sourceUrl,
        siteName: context.crawl.siteName,
        tokens: context.tokens,
        hero,
        crawlNotes: context.crawl.notes,
        model,
      });

      const { renderDesignMd } = await import("@getdesign/tools/render");
      const markdown = renderDesignMd(doc);
      context.markdown = markdown;

      return {
        siteName: doc.siteName,
        sourceUrl: doc.sourceUrl,
        sections: 9,
        markdownBytes: Buffer.byteLength(markdown, "utf8"),
      };
    },
  });

  const agent = new ToolLoopAgent({
    model,
    instructions: COORDINATOR_INSTRUCTIONS,
    tools: {
      crawl,
      screenshot,
      extractTokens,
      synthesize,
    },
    stopWhen: stepCountIs(options.maxSteps ?? 12),
  });

  return { agent, context };
}

export type CoordinatorAgent = ReturnType<typeof createCoordinator>["agent"];
