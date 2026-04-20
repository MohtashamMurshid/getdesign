import { tool } from "ai";
import { z } from "zod";

import {
  crawlSite,
  validatePublicUrl,
  type CrawlSiteResult,
} from "@getdesign/tools/crawler";

const crawlerInputSchema = z.object({
  url: z.string().url().describe("HTTPS URL of the page to crawl"),
  maxStylesheetBytes: z
    .number()
    .int()
    .positive()
    .max(1_000_000)
    .optional()
    .describe("Max bytes to keep per stylesheet (default 200 KB)"),
});

export type CrawlerInput = z.infer<typeof crawlerInputSchema>;

export type CrawlSummary = {
  sourceUrl: string;
  siteName: string;
  stylesheetCount: number;
  totalCssBytes: number;
  sourceUrls: string[];
  notes: string[];
};

export async function runCrawl(input: CrawlerInput): Promise<CrawlSiteResult> {
  const url = validatePublicUrl(input.url);
  return crawlSite({
    url,
    maxStylesheetBytes: input.maxStylesheetBytes ?? 200_000,
  });
}

export function summarizeCrawl(result: CrawlSiteResult): CrawlSummary {
  const totalCssBytes = result.stylesheets.reduce(
    (sum, sheet) => sum + Buffer.byteLength(sheet.content, "utf8"),
    0,
  );

  return {
    sourceUrl: result.sourceUrl,
    siteName: result.siteName,
    stylesheetCount: result.stylesheets.length,
    totalCssBytes,
    sourceUrls: result.sourceUrls,
    notes: result.notes,
  };
}

/**
 * Tool wrapper that surfaces a compact summary to the LLM. The full crawl
 * result (HTML + stylesheets) is large and context-unfriendly, so we stash it
 * in the caller's scope and only return a summary to the model.
 */
export function createCrawlerTool(sink: { crawl?: CrawlSiteResult }) {
  return tool({
    description:
      "Fetch the URL's HTML and all linked/imported stylesheets. Returns a compact summary; the full crawl result is stored in the run context.",
    inputSchema: crawlerInputSchema,
    execute: async (input) => {
      const result = await runCrawl(input);
      sink.crawl = result;
      return summarizeCrawl(result);
    },
  });
}
