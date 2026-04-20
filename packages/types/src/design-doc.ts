import { z } from "zod";

import { breakpointTokenSchema, colorTokenSchema, designTokensSchema, shadowTokenSchema } from "./design-tokens";

const nonEmptyTextSchema = z.string().trim().min(1);

const markdownParagraphSchema = nonEmptyTextSchema;
const markdownListSchema = z.array(nonEmptyTextSchema).min(1);

export const colorRoleEntrySchema = z
  .object({
    hex: colorTokenSchema.shape.hex,
    role: nonEmptyTextSchema,
    whereSeen: nonEmptyTextSchema,
  })
  .strict();

export const colorPaletteGroupSchema = z
  .object({
    heading: nonEmptyTextSchema,
    entries: z.array(colorRoleEntrySchema).min(1),
  })
  .strict();

export const typographyHierarchyEntrySchema = z
  .object({
    role: nonEmptyTextSchema,
    font: nonEmptyTextSchema,
    size: nonEmptyTextSchema,
    weight: nonEmptyTextSchema,
    lineHeight: nonEmptyTextSchema,
    letterSpacing: nonEmptyTextSchema,
    notes: nonEmptyTextSchema.optional(),
  })
  .strict();

export const buttonStyleSchema = z
  .object({
    variant: nonEmptyTextSchema,
    background: nonEmptyTextSchema,
    textColor: nonEmptyTextSchema,
    border: nonEmptyTextSchema,
    radius: nonEmptyTextSchema,
    padding: nonEmptyTextSchema,
    hoverShift: nonEmptyTextSchema,
  })
  .strict();

const namedComponentStyleSchema = z
  .object({
    description: markdownParagraphSchema,
    tokens: markdownListSchema,
  })
  .strict();

export const distinctiveComponentSchema = z
  .object({
    name: nonEmptyTextSchema,
    description: markdownParagraphSchema,
  })
  .strict();

export const depthLevelSchema = z
  .object({
    level: nonEmptyTextSchema,
    use: nonEmptyTextSchema,
    shadow: shadowTokenSchema.shape.value.or(nonEmptyTextSchema),
  })
  .strict();

export const responsiveBreakpointSchema = z
  .object({
    name: nonEmptyTextSchema,
    minWidth: breakpointTokenSchema.shape.minWidth,
    primaryChanges: nonEmptyTextSchema,
  })
  .strict();

export const designDocSchema = z
  .object({
    siteName: nonEmptyTextSchema,
    sourceUrl: z.string().url(),
    visualTheme: z
      .object({
        overview: markdownListSchema.min(2).max(4),
        keyCharacteristics: z.array(nonEmptyTextSchema).min(5).max(8),
      })
      .strict(),
    palette: z
      .object({
        philosophy: markdownParagraphSchema,
        groups: z.array(colorPaletteGroupSchema).min(1),
        notes: markdownParagraphSchema,
      })
      .strict(),
    typography: z
      .object({
        summary: markdownParagraphSchema,
        hierarchy: z.array(typographyHierarchyEntrySchema).min(1),
        principles: z.array(nonEmptyTextSchema).min(3).max(6),
      })
      .strict(),
    components: z
      .object({
        buttons: z.array(buttonStyleSchema).min(1),
        cards: namedComponentStyleSchema,
        inputs: namedComponentStyleSchema,
        navigation: namedComponentStyleSchema,
        imageTreatment: namedComponentStyleSchema,
        distinctive: z.array(distinctiveComponentSchema).min(2).max(4),
      })
      .strict(),
    layout: z
      .object({
        spacingScale: markdownParagraphSchema,
        grid: markdownParagraphSchema,
        whitespace: markdownParagraphSchema,
        radiusScale: markdownParagraphSchema,
      })
      .strict(),
    depth: z
      .object({
        levels: z.array(depthLevelSchema).min(1),
        philosophy: markdownParagraphSchema,
      })
      .strict(),
    interaction: z
      .object({
        hoverStates: markdownParagraphSchema,
        focusStates: markdownParagraphSchema,
        transitions: markdownParagraphSchema,
      })
      .strict(),
    responsive: z
      .object({
        breakpoints: z.array(responsiveBreakpointSchema).min(1),
        touchTargets: markdownParagraphSchema,
        collapsingStrategy: markdownParagraphSchema,
        imageBehavior: markdownParagraphSchema,
      })
      .strict(),
    agentPromptGuide: z
      .object({
        quickColorReference: z.array(nonEmptyTextSchema).min(6).max(12),
        examplePrompts: z.array(nonEmptyTextSchema).length(3),
        iterationGuide: z.array(nonEmptyTextSchema).min(4).max(6),
      })
      .strict(),
  })
  .strict();

export const renderedDesignResultSchema = z
  .object({
    runId: nonEmptyTextSchema,
    markdown: nonEmptyTextSchema,
    doc: designDocSchema,
    tokens: designTokensSchema.optional(),
  })
  .strict();

export type ColorRoleEntry = z.infer<typeof colorRoleEntrySchema>;
export type ColorPaletteGroup = z.infer<typeof colorPaletteGroupSchema>;
export type TypographyHierarchyEntry = z.infer<typeof typographyHierarchyEntrySchema>;
export type ButtonStyle = z.infer<typeof buttonStyleSchema>;
export type DistinctiveComponent = z.infer<typeof distinctiveComponentSchema>;
export type DepthLevel = z.infer<typeof depthLevelSchema>;
export type ResponsiveBreakpoint = z.infer<typeof responsiveBreakpointSchema>;
export type DesignDoc = z.infer<typeof designDocSchema>;
export type RenderedDesignResult = z.infer<typeof renderedDesignResultSchema>;
