import { generateText, Output, type LanguageModel, type UserContent } from "ai";
import { z } from "zod";

import { designDocSchema, type DesignDoc, type DesignTokens } from "@getdesign/types";

/**
 * OpenAI's structured-output validator rejects:
 *   1. JSON Schema `format: "uri"` (emitted by Zod's `z.string().url()`).
 *   2. Any property declared without being in `required` (i.e. optional fields).
 *
 * We always override `sourceUrl` from the caller and re-validate against
 * the strict `designDocSchema` after substitution, so it's safe to relax
 * those constraints for the synthesis call only.
 */
const typographyHierarchyForSynthesisSchema = z
  .object({
    role: z.string().min(1),
    font: z.string().min(1),
    size: z.string().min(1),
    weight: z.string().min(1),
    lineHeight: z.string().min(1),
    letterSpacing: z.string().min(1),
    notes: z.string().nullable(),
  })
  .strict();

const synthesisSchema = designDocSchema.extend({
  sourceUrl: z.string(),
  typography: designDocSchema.shape.typography.extend({
    hierarchy: z.array(typographyHierarchyForSynthesisSchema).min(1),
  }),
});

import type { ScreenshotArtifact } from "@getdesign/tools/daytona";
import { resolveModel } from "../model";

const SYSTEM_INSTRUCTIONS = `You are the Synthesizer sub-agent for getdesign. Your job is to turn deterministic design tokens (extracted from a live website's CSS) plus an optional hero screenshot into a validated 9-section DesignDoc.

Rules:
- The DesignDoc schema is strictly enforced. Fill every required field; do not omit sections.
- Every hex color you reference in the palette MUST appear in the provided tokens.colors list. Do not invent colors.
- Match the tone of the brand: use the site name, the screenshot, and token roles to describe the visual theme, atmosphere, and typography voice.
- Keep prose concise, concrete, and prescriptive so downstream AI coding agents can replicate the system.
- The 9 sections, in order, are: visualTheme, palette, typography, components, layout, depth, interaction, responsive, agentPromptGuide.`;

export type SynthesizerInput = {
  sourceUrl: string;
  siteName: string;
  tokens: DesignTokens;
  hero?: ScreenshotArtifact;
  crawlNotes?: string[];
  model?: LanguageModel;
};

export type SynthesizerResult = {
  doc: DesignDoc;
};

/**
 * Single LLM call that converts DesignTokens + optional hero screenshot into a
 * Zod-validated DesignDoc using AI SDK structured output.
 */
export async function runSynthesize(
  input: SynthesizerInput,
): Promise<SynthesizerResult> {
  const model = input.model ?? resolveModel();

  const userText = buildUserPrompt(input);
  const content: UserContent = [{ type: "text", text: userText }];

  if (input.hero) {
    content.push({
      type: "image",
      image: Buffer.from(input.hero.imageBase64, "base64"),
      mediaType: input.hero.format
        ? `image/${input.hero.format}`
        : "image/png",
    });
  }

  const { output } = await generateText({
    model,
    system: SYSTEM_INSTRUCTIONS,
    messages: [{ role: "user", content }],
    output: Output.object({ schema: synthesisSchema }),
  });

  const normalizedHierarchy = output.typography.hierarchy.map((entry) => {
    const { notes, ...rest } = entry;
    return notes == null ? rest : { ...rest, notes };
  });

  const doc: DesignDoc = designDocSchema.parse({
    ...output,
    siteName: output.siteName ?? input.siteName,
    sourceUrl: input.sourceUrl,
    typography: {
      ...output.typography,
      hierarchy: normalizedHierarchy,
    },
  });

  return { doc };
}

function buildUserPrompt(input: SynthesizerInput): string {
  const tokensJson = JSON.stringify(input.tokens, null, 2);
  const trimmedTokens =
    tokensJson.length > 60_000
      ? `${tokensJson.slice(0, 60_000)}\n...[truncated]`
      : tokensJson;

  const notes = input.crawlNotes?.length
    ? input.crawlNotes.map((note) => `- ${note}`).join("\n")
    : "(no crawl notes)";

  const heroLine = input.hero
    ? `A hero screenshot is attached (${input.hero.width ?? "?"}x${input.hero.height ?? "?"}).`
    : "No screenshot is available; rely on the extracted tokens alone.";

  return `Site: ${input.siteName}
Source URL: ${input.sourceUrl}

${heroLine}

Crawl notes:
${notes}

Deterministic DesignTokens (JSON):
\`\`\`json
${trimmedTokens}
\`\`\`

Produce the DesignDoc JSON now. Remember: every hex in \`palette\` must appear in \`tokens.colors[].hex\`.`;
}
