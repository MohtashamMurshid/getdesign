import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import postcss, { type Declaration, type Root, type Rule } from "postcss";
import safeParse from "postcss-safe-parser";

import {
  designTokensSchema,
  type BorderToken,
  type BreakpointToken,
  type ColorToken,
  type DesignTokens,
  type FontFamilyToken,
  type RadiusToken,
  type ShadowToken,
  type SpacingToken,
  type TypeScaleToken,
} from "@getdesign/types";

import {
  crawlSite,
  crawlSiteResultSchema,
  type CrawlSiteResult,
  type CrawledStylesheet,
} from "../crawler";

const HEX_COLOR_PATTERN =
  /#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{4}|[\dA-Fa-f]{6}|[\dA-Fa-f]{8})\b/g;
const LENGTH_PATTERN =
  /-?(?:\d*\.\d+|\d+)(?:px|rem|em|vw|vh|svh|svw|%)\b/g;
const FONT_FAMILY_FALLBACK_PATTERN = /['"]/g;

type WeightedValue = {
  value: string;
  count: number;
  sources: Set<string>;
};

type WeightedMap = Map<string, WeightedValue>;

type ExtractorContext = {
  sourceUrl: string;
  siteName: string;
  html: string;
  htmlDocument: CheerioAPI;
  stylesheetAssets: CrawledStylesheet[];
  root: Root;
};

type ExtractDesignTokensOptions = {
  sourceUrl: string;
  siteName?: string;
  html?: string;
  stylesheets?: CrawledStylesheet[];
  crawlResult?: CrawlSiteResult;
  fetch?: typeof fetch;
};

type CountedColor = ColorToken & { count: number };

const CSS_SOURCE_LIMIT = 200_000;
const FONT_ROLE_ORDER = ["display", "body", "mono", "ui", "accent"] as const;
type NonSemanticColorBucket =
  | "primary"
  | "accent"
  | "neutral"
  | "surfaces"
  | "borders";

function createWeightedMap(): WeightedMap {
  return new Map<string, WeightedValue>();
}

function incrementWeightedValue(
  map: WeightedMap,
  value: string,
  source: string,
  amount = 1,
): void {
  const current = map.get(value);
  if (current) {
    current.count += amount;
    current.sources.add(source);
    return;
  }

  map.set(value, {
    value,
    count: amount,
    sources: new Set([source]),
  });
}

function trimText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function resolveSiteNameFromHtml(htmlDocument: CheerioAPI, sourceUrl: string): string {
  const ogTitle = trimText(htmlDocument('meta[property="og:site_name"]').attr("content"));
  if (ogTitle) {
    return ogTitle;
  }

  const title = trimText(htmlDocument("title").text());
  if (title) {
    return title.split(/[\-|·|•|—]/)[0]?.trim() || title;
  }

  return new URL(sourceUrl).hostname.replace(/^www\./, "");
}

function normalizeStylesheetAssets(stylesheets: CrawledStylesheet[]): CrawledStylesheet[] {
  return stylesheets.map((asset) => ({
    ...asset,
    content: asset.content.slice(0, CSS_SOURCE_LIMIT),
  }));
}

function stylesheetSourceUrl(asset: CrawledStylesheet, sourceUrl: string): string {
  return asset.url ?? sourceUrl;
}

function buildExtractorContext(input: {
  sourceUrl: string;
  siteName?: string;
  html: string;
  stylesheets: CrawledStylesheet[];
}): ExtractorContext {
  const htmlDocument = load(input.html);
  const stylesheetAssets = normalizeStylesheetAssets(input.stylesheets);
  const combinedCss = stylesheetAssets.map((asset) => asset.content).join("\n");
  const root = safeParse(combinedCss) as Root;

  return {
    sourceUrl: input.sourceUrl,
    siteName:
      trimText(input.siteName) || resolveSiteNameFromHtml(htmlDocument, input.sourceUrl),
    html: input.html,
    htmlDocument,
    stylesheetAssets,
    root,
  };
}

function declarationSource(decl: Declaration): string {
  const parent = decl.parent;
  if (parent?.type === "rule") {
    return `${(parent as Rule).selector} { ${decl.prop}: ${decl.value} }`;
  }

  if (parent?.type === "atrule") {
    return `@${parent.name} ${parent.params}`.trim();
  }

  return `${decl.prop}: ${decl.value}`;
}

function normalizeHexColor(value: string): string | null {
  const match = value.match(/^#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{4}|[\dA-Fa-f]{6}|[\dA-Fa-f]{8})$/);
  if (!match) {
    return null;
  }

  return value.toUpperCase();
}

function classifyColor(prop: string, source: string): "primary" | "accent" | "neutral" | "surfaces" | "borders" | "semantic" {
  const haystack = `${prop} ${source}`.toLowerCase();

  if (/(success|positive)/.test(haystack)) {
    return "semantic";
  }

  if (/(warning|caution)/.test(haystack)) {
    return "semantic";
  }

  if (/(error|danger|destructive)/.test(haystack)) {
    return "semantic";
  }

  if (/(info|notice|highlight)/.test(haystack)) {
    return "semantic";
  }

  if (/(border|stroke|divider|outline)/.test(haystack)) {
    return "borders";
  }

  if (/(background|surface|canvas|panel|card|overlay)/.test(haystack)) {
    return "surfaces";
  }

  if (/(accent|brand|primary|cta|focus|link|interactive)/.test(haystack)) {
    return "accent";
  }

  if (/(text|foreground|neutral|muted|gray|grey)/.test(haystack)) {
    return "neutral";
  }

  return "primary";
}

function semanticRoleForSource(prop: string, source: string): "success" | "warning" | "error" | "info" | null {
  const haystack = `${prop} ${source}`.toLowerCase();

  if (/(success|positive)/.test(haystack)) {
    return "success";
  }

  if (/(warning|caution)/.test(haystack)) {
    return "warning";
  }

  if (/(error|danger|destructive)/.test(haystack)) {
    return "error";
  }

  if (/(info|notice|highlight)/.test(haystack)) {
    return "info";
  }

  return null;
}

function classifyNonSemanticColor(
  prop: string,
  source: string,
): NonSemanticColorBucket {
  const bucket = classifyColor(prop, source);

  return bucket === "semantic" ? "primary" : bucket;
}

function dedupeCountedColors(colors: CountedColor[]): ColorToken[] {
  return colors
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.hex.localeCompare(right.hex);
    })
    .map(({ count: _count, ...color }) => color);
}

function extractColorsFromRoot(root: Root): DesignTokens["colors"] {
  const bucketed = {
    primary: new Map<string, CountedColor>(),
    accent: new Map<string, CountedColor>(),
    neutral: new Map<string, CountedColor>(),
    surfaces: new Map<string, CountedColor>(),
    borders: new Map<string, CountedColor>(),
    semantic: {
      success: new Map<string, CountedColor>(),
      warning: new Map<string, CountedColor>(),
      error: new Map<string, CountedColor>(),
      info: new Map<string, CountedColor>(),
    },
  };

  root.walkDecls((decl) => {
    const source = declarationSource(decl);
    const matches = decl.value.match(HEX_COLOR_PATTERN);
    if (!matches) {
      return;
    }

    for (const rawColor of matches) {
      const hex = normalizeHexColor(rawColor);
      if (!hex) {
        continue;
      }

      const color: CountedColor = {
        hex,
        role: trimText(decl.prop.replace(/^--/, "").replace(/[-_]/g, " ")) || decl.prop,
        source,
        count: 1,
      };

      const semanticRole = semanticRoleForSource(decl.prop, source);
      if (semanticRole) {
        const existing = bucketed.semantic[semanticRole].get(hex);
        if (existing) {
          existing.count += 1;
        } else {
          bucketed.semantic[semanticRole].set(hex, color);
        }
        continue;
      }

      const bucket = classifyNonSemanticColor(
        decl.prop,
        source,
      );
      const targetMap = bucketed[bucket];
      const existing = targetMap.get(hex);
      if (existing) {
        existing.count += 1;
      } else {
        targetMap.set(hex, color);
      }
    }
  });

  return {
    primary: dedupeCountedColors([...bucketed.primary.values()]).slice(0, 8),
    accent: dedupeCountedColors([...bucketed.accent.values()]).slice(0, 8),
    neutral: dedupeCountedColors([...bucketed.neutral.values()]).slice(0, 8),
    semantic: {
      success: dedupeCountedColors([...bucketed.semantic.success.values()]).slice(0, 4),
      warning: dedupeCountedColors([...bucketed.semantic.warning.values()]).slice(0, 4),
      error: dedupeCountedColors([...bucketed.semantic.error.values()]).slice(0, 4),
      info: dedupeCountedColors([...bucketed.semantic.info.values()]).slice(0, 4),
    },
    surfaces: dedupeCountedColors([...bucketed.surfaces.values()]).slice(0, 8),
    borders: dedupeCountedColors([...bucketed.borders.values()]).slice(0, 8),
  };
}

function dedupeTokenValues<T extends { source: string }>(
  values: T[],
  getKey: (value: T) => string,
): T[] {
  const map = new Map<string, T>();

  for (const value of values) {
    const key = getKey(value);
    if (!map.has(key)) {
      map.set(key, value);
    }
  }

  return [...map.values()];
}

function extractFontFamilies(root: Root): FontFamilyToken[] {
  const fontMap = new Map<string, FontFamilyToken>();

  root.walkAtRules("font-face", (rule) => {
    let family = "";
    const weights: string[] = [];

    rule.walkDecls((decl) => {
      if (decl.prop === "font-family") {
        family = trimText(decl.value.replace(FONT_FAMILY_FALLBACK_PATTERN, ""));
      }

      if (decl.prop === "font-weight") {
        weights.push(trimText(decl.value));
      }
    });

    if (!family) {
      return;
    }

    const lowerFamily = family.toLowerCase();
    const role: FontFamilyToken["role"] =
      lowerFamily.includes("mono") || lowerFamily.includes("code")
        ? "mono"
        : lowerFamily.includes("display")
          ? "display"
          : "body";

    const existing = fontMap.get(family);
    const mergedWeights = [...new Set([...(existing?.weights ?? []), ...weights])];

    fontMap.set(family, {
      family,
      role: existing?.role ?? role,
      source: existing?.source ?? "@font-face",
      weights: mergedWeights,
    });
  });

  root.walkDecls((decl) => {
    if (decl.prop !== "font-family") {
      return;
    }

    const source = declarationSource(decl);
    const families = decl.value
      .split(",")
      .map((value) => trimText(value.replace(FONT_FAMILY_FALLBACK_PATTERN, "")))
      .filter(Boolean);

    for (const family of families) {
      if (fontMap.has(family)) {
        continue;
      }

      const lowerSource = source.toLowerCase();
      const role: FontFamilyToken["role"] =
        lowerSource.includes("code") || lowerSource.includes("mono")
          ? "mono"
          : lowerSource.includes("hero") ||
              lowerSource.includes("display") ||
              lowerSource.includes("h1")
            ? "display"
            : "body";

      fontMap.set(family, {
        family,
        role,
        source,
        weights: [],
      });
    }
  });

  return [...fontMap.values()].sort((left, right) => {
    const leftIndex = FONT_ROLE_ORDER.indexOf(left.role);
    const rightIndex = FONT_ROLE_ORDER.indexOf(right.role);
    return leftIndex - rightIndex || left.family.localeCompare(right.family);
  });
}

function inferTypeRole(rule: Rule, decl: Declaration): string {
  const selector = rule.selector.toLowerCase();
  if (selector.includes("h1")) return "H1";
  if (selector.includes("h2")) return "H2";
  if (selector.includes("h3")) return "H3";
  if (selector.includes("small")) return "Small";
  if (selector.includes("code") || selector.includes("mono")) return "Mono";
  if (selector.includes("hero") || selector.includes("display")) return "Display";

  const sizeMatch = decl.value.match(/(\d+(?:\.\d+)?)px/);
  if (!sizeMatch) return "Body";

  const size = Number(sizeMatch[1]);
  if (size >= 48) return "Display";
  if (size >= 36) return "H1";
  if (size >= 28) return "H2";
  if (size >= 20) return "H3";
  if (size <= 14) return "Small";
  return "Body";
}

function extractTypographyScale(root: Root): TypeScaleToken[] {
  const tokens: TypeScaleToken[] = [];
  const seen = new Set<string>();

  root.walkRules((rule) => {
    const current: Partial<TypeScaleToken> = {};

    rule.walkDecls((decl) => {
      if (decl.prop === "font-family") {
        current.weight ??= "400";
        current.lineHeight ??= "normal";
        current.letterSpacing ??= "normal";
        current.source ??= declarationSource(decl);
        current.role ??= inferTypeRole(rule, decl);
        current.size ??= "16px";
      }
      if (decl.prop === "font-size") {
        current.size = trimText(decl.value);
        current.role = inferTypeRole(rule, decl);
        current.source = declarationSource(decl);
      }
      if (decl.prop === "font-weight") {
        current.weight = trimText(decl.value);
      }
      if (decl.prop === "line-height") {
        current.lineHeight = trimText(decl.value);
      }
      if (decl.prop === "letter-spacing") {
        current.letterSpacing = trimText(decl.value);
      }
    });

    if (!current.role || !current.size || !current.source) {
      return;
    }

    const entry: TypeScaleToken = {
      role: current.role,
      size: current.size,
      weight: current.weight ?? "400",
      lineHeight: current.lineHeight ?? "normal",
      letterSpacing: current.letterSpacing ?? "normal",
      source: current.source,
    };

    const key = `${entry.role}|${entry.size}|${entry.weight}|${entry.lineHeight}|${entry.letterSpacing}`;
    if (!seen.has(key)) {
      seen.add(key);
      tokens.push(entry);
    }
  });

  return tokens.slice(0, 12);
}

function extractSpacing(root: Root): SpacingToken[] {
  const spacing = createWeightedMap();

  root.walkDecls((decl) => {
    const matches = decl.value.match(LENGTH_PATTERN);
    if (!matches) {
      return;
    }

    if (!/(margin|padding|gap|inset|space|top|right|bottom|left|width|height)/i.test(decl.prop)) {
      return;
    }

    const source = declarationSource(decl);
    for (const match of matches) {
      incrementWeightedValue(spacing, match, source);
    }
  });

  return [...spacing.values()]
    .filter((value) => value.count >= 2)
    .sort((left, right) => left.count - right.count || left.value.localeCompare(right.value))
    .map(
      (value): SpacingToken => ({
        value: value.value,
        source: [...value.sources][0] ?? value.value,
        usageCount: value.count,
      }),
    );
}

function extractRadii(root: Root): RadiusToken[] {
  const radii: RadiusToken[] = [];

  root.walkDecls((decl) => {
    if (!/border-radius|radius/i.test(decl.prop)) {
      return;
    }

    radii.push({
      name:
        decl.prop.startsWith("--")
          ? trimText(decl.prop.replace(/^--/, "").replace(/[-_]/g, " "))
          : decl.prop,
      value: trimText(decl.value),
      source: declarationSource(decl),
    });
  });

  return dedupeTokenValues(radii, (radius) => `${radius.name}|${radius.value}`);
}

function extractShadows(root: Root): ShadowToken[] {
  const shadows: ShadowToken[] = [];

  root.walkDecls((decl) => {
    if (!/box-shadow|shadow/i.test(decl.prop)) {
      return;
    }

    shadows.push({
      value: trimText(decl.value),
      role: trimText(decl.prop.replace(/^--/, "").replace(/[-_]/g, " ")),
      source: declarationSource(decl),
    });
  });

  return dedupeTokenValues(shadows, (shadow) => `${shadow.role}|${shadow.value}`);
}

function extractBorders(root: Root): BorderToken[] {
  const borders: BorderToken[] = [];

  root.walkDecls((decl) => {
    const source = declarationSource(decl);

    if (decl.prop === "border") {
      const width = decl.value.match(/(?:\d*\.\d+|\d+)px/)?.[0];
      const style = decl.value.match(/\b(solid|dashed|dotted|double|none)\b/i)?.[0];
      const color = decl.value.match(HEX_COLOR_PATTERN)?.[0];

      if (!width || !color) {
        return;
      }

      borders.push({
        width,
        style: style ? style.toLowerCase() : "solid",
        color: color.toUpperCase(),
        role: "border",
        source,
      });
      return;
    }

    if (decl.prop === "border-width") {
      return;
    }
  });

  return dedupeTokenValues(
    borders,
    (border) => `${border.width}|${border.style ?? ""}|${border.color}`,
  );
}

function extractBreakpoints(root: Root): BreakpointToken[] {
  const breakpoints: BreakpointToken[] = [];

  root.walkAtRules("media", (rule) => {
    const match = rule.params.match(/min-width:\s*([^)]+)/i);
    if (!match) {
      return;
    }

    breakpoints.push({
      name: `bp-${breakpoints.length + 1}`,
      minWidth: trimText(match[1]),
      source: `@media ${rule.params}`,
    });
  });

  return dedupeTokenValues(breakpoints, (breakpoint) => breakpoint.minWidth);
}

export function extractDesignTokens(
  options: ExtractDesignTokensOptions,
): DesignTokens {
  const sourceUrl = options.sourceUrl.trim();
  if (!sourceUrl) {
    throw new Error("extractDesignTokens requires a sourceUrl.");
  }

  const crawlResult = options.crawlResult
    ? crawlSiteResultSchema.parse(options.crawlResult)
    : null;
  const html = options.html ?? crawlResult?.html;
  const stylesheets = options.stylesheets ?? crawlResult?.stylesheets;

  if (!html) {
    throw new Error("extractDesignTokens requires html or crawlResult.html.");
  }

  if (!stylesheets || stylesheets.length === 0) {
    throw new Error(
      "extractDesignTokens requires at least one stylesheet or a crawlResult with stylesheets.",
    );
  }

  const context = buildExtractorContext({
    sourceUrl,
    siteName: options.siteName ?? crawlResult?.siteName,
    html,
    stylesheets,
  });

  return designTokensSchema.parse({
    siteName: context.siteName,
    sourceUrl,
    sources: [
      ...new Set(
        context.stylesheetAssets.map((asset) => stylesheetSourceUrl(asset, sourceUrl)),
      ),
    ],
    colors: extractColorsFromRoot(context.root),
    typography: {
      fontFamilies: extractFontFamilies(context.root),
      scale: extractTypographyScale(context.root),
    },
    spacing: extractSpacing(context.root),
    radii: extractRadii(context.root),
    shadows: extractShadows(context.root),
    borders: extractBorders(context.root),
    breakpoints: extractBreakpoints(context.root),
  });
}

export async function extractDesignTokensFromUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DesignTokens> {
  const crawlResult = await crawlSite({
    url,
    fetch: fetchImpl,
  });
  return extractDesignTokens({
    sourceUrl: crawlResult.sourceUrl,
    siteName: crawlResult.siteName,
    crawlResult,
  });
}
