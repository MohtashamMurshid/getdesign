import { generateText, type LanguageModel, type UserContent } from "ai";

import type { ScreenshotArtifact } from "@getdesign/tools/daytona";

import { resolveModel } from "../model.js";

const SYSTEM_INSTRUCTIONS = `You are the VisualDescriber sub-agent for getdesign. Your job is to look at a stack of viewport screenshots that together form one complete rendered landing page, and write a thorough, designer-grade visual description in markdown. Describe what you actually see, in concrete terms. No marketing prose, no abstract praise, no hallucinated details. Use the exact section headings provided.`;

const REQUIRED_SECTIONS = [
  "## Overall composition & rhythm",
  "## Section-by-section walkthrough",
  "## Navigation & header",
  "## Hero / first impression",
  "## Imagery, iconography, illustration",
  "## Typography in context",
  "## Color usage in context",
  "## Microcopy & messaging",
  "## Visible interaction affordances",
  "## Footer & end-of-page",
  "## Notable details",
] as const;

export type DescribeInput = {
  sourceUrl: string;
  siteName: string;
  /** ALL tiles, in document order, top-to-bottom. */
  tiles: ScreenshotArtifact[];
  documentHeight: number;
  documentWidth: number;
  viewport: { width: number; height: number };
  model?: LanguageModel;
};

export type DescribeResult = {
  description: string;
  promptTokens?: number;
  completionTokens?: number;
};

/**
 * Single LLM call that converts the full ordered tile sequence into a long-form,
 * designer-grade markdown walkthrough of the page. The output is consumed both
 * as a first-class artifact AND as input to the SynthesizerAgent so the
 * structured DesignDoc can be grounded in an honest rendition of the page
 * (including below-the-fold content) rather than just CSS tokens.
 */
export async function runDescribe(
  input: DescribeInput,
): Promise<DescribeResult> {
  const model = input.model ?? resolveModel();
  const tiles = input.tiles;
  if (tiles.length === 0) {
    throw new Error("runDescribe requires at least one tile.");
  }

  const headerText = buildPrompt(input);
  const content: UserContent = [{ type: "text", text: headerText }];
  for (const tile of tiles) {
    content.push({
      type: "image",
      image: Buffer.from(tile.imageBase64, "base64"),
      mediaType: tile.format ? `image/${tile.format}` : "image/png",
    });
  }

  const { text, usage } = await generateText({
    model,
    system: SYSTEM_INSTRUCTIONS,
    messages: [{ role: "user", content }],
  });

  const promptTokens =
    typeof usage?.inputTokens === "number" ? usage.inputTokens : undefined;
  const completionTokens =
    typeof usage?.outputTokens === "number" ? usage.outputTokens : undefined;

  return {
    description: text.trim(),
    promptTokens,
    completionTokens,
  };
}

function buildPrompt(input: DescribeInput): string {
  const tileCount = input.tiles.length;
  const sections = REQUIRED_SECTIONS.join("\n");
  return `You are looking at the rendered top-to-bottom screenshots of ${input.sourceUrl} (site: ${input.siteName}).

There are ${tileCount} tile${tileCount === 1 ? "" : "s"}, each ${input.viewport.width}x${input.viewport.height} px, stacked vertically in document order (tile 1 = top of page, tile ${tileCount} = bottom). The total rendered document is ${input.documentWidth}x${input.documentHeight} px.

Produce a long, exhaustive visual description in markdown. Be specific and concrete — describe everything a designer would notice (e.g. "a 3-column grid of card components, each with ~16px corners, light grey fill, dark text"), not abstract praise ("clean and modern"). When useful, reference tile numbers like "(tile 2)" so the reader can map your prose back to the screenshots.

Required: use the exact section headings below, in this order, and do not skip any:

${sections}

Hard rules:
- Describe only what is visible in the screenshots. Do not speculate about behavior, animations, or interactions you cannot see. Do not invent brand history, founders, pricing, or features.
- Prefer concrete language and measurable observations over abstract adjectives.
- Aim for 1500–3000 words for a typical page. Better long and concrete than short and abstract. There is no hard upper bound.
- Output pure markdown, starting directly with the first heading. No preamble, no closing summary outside the headings.`;
}
