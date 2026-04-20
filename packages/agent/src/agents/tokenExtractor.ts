import { tool } from "ai";
import { z } from "zod";

import {
  extractDesignTokens,
  type CrawlSiteResult,
} from "@getdesign/tools";
import type { DesignTokens } from "@getdesign/types";

const tokenExtractorInputSchema = z.object({
  sourceUrl: z.string().url(),
});

export type TokenExtractorInput = z.infer<typeof tokenExtractorInputSchema>;

export function runExtractTokens(
  crawl: CrawlSiteResult,
  sourceUrl = crawl.sourceUrl,
): DesignTokens {
  return extractDesignTokens({
    sourceUrl,
    siteName: crawl.siteName,
    crawlResult: crawl,
  });
}

export function summarizeTokens(tokens: DesignTokens): Record<string, unknown> {
  return {
    siteName: tokens.siteName,
    sourceUrl: tokens.sourceUrl,
    colorCount: tokens.colors.length,
    fontFamilies: tokens.typography.fontFamilies.map((font) => font.family),
    typeScaleCount: tokens.typography.scale.length,
    spacingCount: tokens.spacing.length,
    radiiCount: tokens.radii.length,
    shadowCount: tokens.shadows.length,
    borderCount: tokens.borders.length,
    breakpointCount: tokens.breakpoints.length,
  };
}

export function createTokenExtractorTool(sink: {
  crawl?: CrawlSiteResult;
  tokens?: DesignTokens;
}) {
  return tool({
    description:
      "Deterministically extract DesignTokens (colors, typography, spacing, radii, shadows, borders, breakpoints) from the previously-crawled HTML + CSS. Requires `crawl` in the run context.",
    inputSchema: tokenExtractorInputSchema,
    execute: async ({ sourceUrl }) => {
      if (!sink.crawl) {
        throw new Error(
          "TokenExtractor requires a completed crawl; call the crawl tool first.",
        );
      }

      const tokens = runExtractTokens(sink.crawl, sourceUrl);
      sink.tokens = tokens;
      return summarizeTokens(tokens);
    },
  });
}
