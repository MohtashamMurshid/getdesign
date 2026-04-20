import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);

export const hexColorSchema = z.string().regex(
  /^#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{4}|[\dA-Fa-f]{6}|[\dA-Fa-f]{8})$/,
  "Expected a CSS hex color.",
);

export const tokenSourceSchema = nonEmptyTextSchema;

export const colorTokenSchema = z
  .object({
    hex: hexColorSchema,
    role: nonEmptyTextSchema,
    source: tokenSourceSchema,
  })
  .strict();

export const semanticColorTokensSchema = z
  .object({
    success: z.array(colorTokenSchema),
    warning: z.array(colorTokenSchema),
    error: z.array(colorTokenSchema),
    info: z.array(colorTokenSchema),
  })
  .strict();

export const fontFamilyTokenSchema = z
  .object({
    family: nonEmptyTextSchema,
    role: z.enum(["display", "body", "mono", "accent", "ui"]),
    source: tokenSourceSchema,
    weights: z.array(nonEmptyTextSchema).default([]),
  })
  .strict();

export const typeScaleTokenSchema = z
  .object({
    role: nonEmptyTextSchema,
    size: nonEmptyTextSchema,
    weight: nonEmptyTextSchema,
    lineHeight: nonEmptyTextSchema,
    letterSpacing: nonEmptyTextSchema,
    source: tokenSourceSchema,
  })
  .strict();

export const spacingTokenSchema = z
  .object({
    value: nonEmptyTextSchema,
    source: tokenSourceSchema,
    usageCount: z.number().int().nonnegative().optional(),
  })
  .strict();

export const radiusTokenSchema = z
  .object({
    name: nonEmptyTextSchema,
    value: nonEmptyTextSchema,
    source: tokenSourceSchema,
  })
  .strict();

export const shadowTokenSchema = z
  .object({
    value: nonEmptyTextSchema,
    role: nonEmptyTextSchema,
    source: tokenSourceSchema,
  })
  .strict();

export const borderTokenSchema = z
  .object({
    width: nonEmptyTextSchema,
    style: nonEmptyTextSchema.optional(),
    color: hexColorSchema,
    role: nonEmptyTextSchema,
    source: tokenSourceSchema,
  })
  .strict();

export const breakpointTokenSchema = z
  .object({
    name: nonEmptyTextSchema.optional(),
    minWidth: nonEmptyTextSchema,
    source: tokenSourceSchema,
  })
  .strict();

export const designTokensSchema = z
  .object({
    siteName: nonEmptyTextSchema,
    sourceUrl: z.string().url(),
    sources: z.array(z.string().url()).min(1),
    colors: z
      .object({
        primary: z.array(colorTokenSchema),
        accent: z.array(colorTokenSchema),
        neutral: z.array(colorTokenSchema),
        semantic: semanticColorTokensSchema,
        surfaces: z.array(colorTokenSchema),
        borders: z.array(colorTokenSchema),
      })
      .strict(),
    typography: z
      .object({
        fontFamilies: z.array(fontFamilyTokenSchema).min(1),
        scale: z.array(typeScaleTokenSchema).min(1),
      })
      .strict(),
    spacing: z.array(spacingTokenSchema),
    radii: z.array(radiusTokenSchema),
    shadows: z.array(shadowTokenSchema),
    borders: z.array(borderTokenSchema),
    breakpoints: z.array(breakpointTokenSchema),
  })
  .strict();

export type ColorToken = z.infer<typeof colorTokenSchema>;
export type SemanticColorTokens = z.infer<typeof semanticColorTokensSchema>;
export type FontFamilyToken = z.infer<typeof fontFamilyTokenSchema>;
export type TypeScaleToken = z.infer<typeof typeScaleTokenSchema>;
export type SpacingToken = z.infer<typeof spacingTokenSchema>;
export type RadiusToken = z.infer<typeof radiusTokenSchema>;
export type ShadowToken = z.infer<typeof shadowTokenSchema>;
export type BorderToken = z.infer<typeof borderTokenSchema>;
export type BreakpointToken = z.infer<typeof breakpointTokenSchema>;
export type DesignTokens = z.infer<typeof designTokensSchema>;
