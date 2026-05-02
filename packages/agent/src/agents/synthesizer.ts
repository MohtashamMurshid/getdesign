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

/**
 * Defensive cap on the number of tile images sent to the synthesizer in a
 * single call. The deterministic CSS tokens plus the long visual description
 * carry the bulk of the signal; tiles beyond this cap quickly hit
 * provider-side image-count limits and balloon token cost without
 * proportional benefit. The describe pass receives the FULL ordered tile
 * sequence (no cap) so nothing is lost upstream.
 */
export const MAX_SYNTHESIS_TILES = 12;

const SYSTEM_INSTRUCTIONS = `You are the Synthesizer sub-agent for getdesign. Your job is to turn deterministic design tokens (extracted from a live website's CSS), a long-form visual description from the VisualDescriber sub-agent, and the actual rendered page tiles into a validated 9-section DesignDoc.

General rules:
- The DesignDoc schema is strictly enforced. Fill every required field; do not omit sections.
- Every hex color you reference in the palette MUST appear in the provided tokens.colors list. Do not invent colors.
- Use the visual description and tiles to ground the *qualitative* sections (atmosphere, voice, layout intent, distinctive components). Use them when the tokens are silent.

CSS-grounded numeric rules (CRITICAL — these were the most common failure modes in past runs):
- For typography sizes, weights, line-heights, and letter-spacing: copy the values verbatim from the provided "CSS facts" digest and \`tokens.typography.scale\` — including \`clamp(...)\` expressions. NEVER eyeball pixel sizes from the screenshot. If CSS says \`clamp(36px, 6vw, 64px)\` write exactly that, NOT "~80–100px".
- For \`typography.hierarchy\` entries, prefer one entry per distinct CSS rule found in the type scale (display/hero, h1, h2, body, small, mono, etc.). Pull the \`font-size\`, \`font-weight\`, \`line-height\`, \`letter-spacing\` straight from the matching token.
- For \`layout.spacingScale\`: enumerate the actual spacing values from \`tokens.spacing\` (e.g. "4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px on a 4px base"). Do NOT make up "1px, 3px, 8px"-style guesses.
- For \`layout.radiusScale\`: enumerate every distinct radius from \`tokens.radii\` with names where present (e.g. "sm 4px, md 8px, lg 12px, xl 16px, full 9999px"). Do NOT drop sizes the CSS uses.
- For \`responsive.breakpoints\`: use the \`min-width\` values from \`tokens.breakpoints\` exactly. Use the same breakpoint count and order.
- For \`interaction.transitions\`: ground duration/easing in any \`transition\` / \`animation\` source strings present in the tokens; if none are available, say so plainly rather than inventing "120–180ms".
- For \`components.buttons\` and inputs: when CSS gives you radius/border/background tokens, cite them verbatim (e.g. "border-radius: 8px (md)") rather than ranges like "~8px to 12px".

Tone:
- Match the brand using the site name, description, tiles, and token roles.
- Prose stays concise, concrete, and prescriptive so downstream AI coding agents can replicate the system.
- The 9 sections, in order, are: visualTheme, palette, typography, components, layout, depth, interaction, responsive, agentPromptGuide.`;

export type SynthesizerInput = {
  sourceUrl: string;
  siteName: string;
  tokens: DesignTokens;
  /** Full ordered tile sequence (top → bottom). Capped at MAX_SYNTHESIS_TILES. */
  tiles?: ScreenshotArtifact[];
  /** Long-form markdown produced by the VisualDescriber sub-agent. */
  visualDescription?: string;
  crawlNotes?: string[];
  model?: LanguageModel;
};

export type SynthesizerResult = {
  doc: DesignDoc;
};

/**
 * Single LLM call that converts DesignTokens + the visual description + the
 * page tiles into a Zod-validated DesignDoc using AI SDK structured output.
 */
export async function runSynthesize(
  input: SynthesizerInput,
): Promise<SynthesizerResult> {
  const model = input.model ?? resolveModel();

  const allTiles = input.tiles ?? [];
  const tiles = allTiles.slice(0, MAX_SYNTHESIS_TILES);
  const omitted = Math.max(0, allTiles.length - tiles.length);

  const userText = buildUserPrompt(input, tiles.length, omitted);
  const content: UserContent = [{ type: "text", text: userText }];

  for (const tile of tiles) {
    content.push({
      type: "image",
      image: Buffer.from(tile.imageBase64, "base64"),
      mediaType: tile.format ? `image/${tile.format}` : "image/png",
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

function buildUserPrompt(
  input: SynthesizerInput,
  attachedTileCount: number,
  omittedTileCount: number,
): string {
  const tokensJson = JSON.stringify(input.tokens, null, 2);
  const trimmedTokens =
    tokensJson.length > 60_000
      ? `${tokensJson.slice(0, 60_000)}\n...[truncated]`
      : tokensJson;

  const notes = input.crawlNotes?.length
    ? input.crawlNotes.map((note) => `- ${note}`).join("\n")
    : "(no crawl notes)";

  const tilesLine =
    attachedTileCount > 0
      ? `${attachedTileCount} page tile${attachedTileCount === 1 ? "" : "s"} attached below in document order (tile 1 = top).${
          omittedTileCount > 0
            ? ` [tiles ${attachedTileCount + 1}..${attachedTileCount + omittedTileCount} omitted to bound token cost; the visual description above already covers them.]`
            : ""
        }`
      : "No page tiles available; rely on the extracted tokens and visual description alone.";

  const descriptionBlock = input.visualDescription
    ? `Visual description (from the VisualDescriber sub-agent):

\`\`\`markdown
${input.visualDescription}
\`\`\`
`
    : "No visual description available for this run.";

  const cssFacts = summarizeCssFacts(input.tokens);

  return `Site: ${input.siteName}
Source URL: ${input.sourceUrl}

${descriptionBlock}

${tilesLine}

Crawl notes:
${notes}

CSS facts digest (these are the SOURCE OF TRUTH for numeric specs — copy values verbatim into the DesignDoc; do NOT estimate from the screenshot):
${cssFacts}

Deterministic DesignTokens (JSON):
\`\`\`json
${trimmedTokens}
\`\`\`

Produce the DesignDoc JSON now. Remember:
- Every hex in \`palette\` must appear in \`tokens.colors[].hex\`.
- Every numeric spec (font-size, weight, line-height, letter-spacing, spacing, radius, breakpoint min-width, transition duration) must be copied from the CSS facts digest above. If the CSS gives a \`clamp(...)\`, keep it as \`clamp(...)\`.`;
}

/**
 * Pre-renders the most prompt-relevant CSS-grounded facts in a compact,
 * top-of-prompt digest so the synthesizer LLM doesn't have to dig through
 * the long tokens JSON to find numeric ground truth. Past failure modes
 * (e.g. "~80-100px hero, weight 700-800" when actual CSS was clamp(36px, 6vw, 64px) / 500)
 * came from the model eyeballing screenshots instead of reading tokens.
 */
function summarizeCssFacts(tokens: DesignTokens): string {
  const lines: string[] = [];

  // Font families
  if (tokens.typography.fontFamilies.length > 0) {
    lines.push("Font families:");
    for (const font of tokens.typography.fontFamilies.slice(0, 8)) {
      const weights = font.weights.length
        ? ` (weights: ${font.weights.join(", ")})`
        : "";
      lines.push(`  - ${font.role}: ${font.family}${weights}`);
    }
  }

  // Type scale (sorted largest-first by best-effort numeric size)
  if (tokens.typography.scale.length > 0) {
    lines.push("");
    lines.push("Type scale (verbatim from CSS — copy size/weight/line-height/letter-spacing exactly):");
    const ordered = [...tokens.typography.scale].sort(
      (a, b) => approximatePxSize(b.size) - approximatePxSize(a.size),
    );
    for (const entry of ordered.slice(0, 12)) {
      lines.push(
        `  - role=${entry.role} | size=${entry.size} | weight=${entry.weight} | line-height=${entry.lineHeight} | letter-spacing=${entry.letterSpacing}`,
      );
    }
  }

  // Spacing scale
  if (tokens.spacing.length > 0) {
    lines.push("");
    lines.push("Spacing scale (sorted ascending; use these values, not eyeballed gaps):");
    const sortedSpacing = [...tokens.spacing].sort(
      (a, b) => approximatePxSize(a.value) - approximatePxSize(b.value),
    );
    const dedupedSpacing: string[] = [];
    const seenSpacing = new Set<string>();
    for (const s of sortedSpacing) {
      if (seenSpacing.has(s.value)) continue;
      seenSpacing.add(s.value);
      const usage =
        typeof s.usageCount === "number" ? ` (×${s.usageCount})` : "";
      dedupedSpacing.push(`${s.value}${usage}`);
    }
    lines.push(`  ${dedupedSpacing.slice(0, 16).join(", ")}`);
  }

  // Radius scale
  if (tokens.radii.length > 0) {
    lines.push("");
    lines.push("Radius scale (every distinct radius — do not drop any):");
    const seenRadii = new Set<string>();
    const radiusEntries: string[] = [];
    for (const r of tokens.radii) {
      const key = `${r.name}|${r.value}`;
      if (seenRadii.has(key)) continue;
      seenRadii.add(key);
      radiusEntries.push(`${r.name}=${r.value}`);
    }
    lines.push(`  ${radiusEntries.join(", ")}`);
  }

  // Breakpoints
  if (tokens.breakpoints.length > 0) {
    lines.push("");
    lines.push("Breakpoints (min-width values verbatim):");
    for (const bp of tokens.breakpoints) {
      lines.push(`  - ${bp.name ?? "bp"}: min-width ${bp.minWidth}`);
    }
  }

  // Borders
  if (tokens.borders.length > 0) {
    lines.push("");
    lines.push("Border tokens (width / style / color):");
    for (const b of tokens.borders.slice(0, 6)) {
      lines.push(
        `  - ${b.role}: ${b.width} ${b.style ?? "solid"} ${b.color}`,
      );
    }
  }

  // Shadows (often "none" — useful negative signal)
  if (tokens.shadows.length > 0) {
    lines.push("");
    lines.push("Shadow tokens:");
    for (const s of tokens.shadows.slice(0, 6)) {
      lines.push(`  - ${s.role}: ${s.value}`);
    }
  } else {
    lines.push("");
    lines.push("Shadow tokens: (none found — this site uses flat / borderless depth)");
  }

  return lines.length > 0 ? lines.join("\n") : "(no deterministic CSS facts available)";
}

/**
 * Best-effort conversion of a CSS length to an approximate px number for
 * sorting purposes only. Handles px, rem, em, and clamp(...) by reading
 * the middle/preferred value. Returns 0 when nothing usable is found.
 */
function approximatePxSize(value: string): number {
  const trimmed = value.trim();

  // clamp(min, preferred, max) — use preferred (middle) arg.
  const clampMatch = trimmed.match(/^clamp\(([^,]+),([^,]+),([^)]+)\)/i);
  if (clampMatch) {
    const preferred = clampMatch[2]?.trim() ?? "";
    return approximatePxSize(preferred) || approximatePxSize(clampMatch[3] ?? "");
  }

  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return 0;

  if (/rem\b/i.test(trimmed)) return num * 16;
  if (/em\b/i.test(trimmed)) return num * 16;
  if (/vw\b|vh\b|svh\b|svw\b/i.test(trimmed)) return num * 8; // rough
  if (/%/.test(trimmed)) return num;
  return num; // assume px
}
