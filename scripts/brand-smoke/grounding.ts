/**
 * M3/G2 palette grounding: every DesignDoc palette hex must appear in
 * crawled CSS. #RGB, #RRGGBB, and rgb() are compared as the same color
 * (#fff === #ffffff === rgb(255,255,255)).
 */

export type PaletteLike = {
  groups: Array<{
    heading?: string;
    entries: Array<{ hex: string }>;
  }>;
};

export type GroundingResult = {
  pass: boolean;
  misses: string[];
};

/** Lowercase 6-digit RGB without `#`, or null if the value is not a hex/rgb color. */
export function canonicalColorKey(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    return hexToKey(trimmed);
  }

  const rgb = trimmed.match(/^rgba?\(\s*([^)]+)\)$/i);
  if (rgb?.[1]) {
    return rgbArgsToKey(rgb[1]);
  }

  return hexToKey(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
}

export function collectCssColorKeys(css: string): Set<string> {
  const keys = new Set<string>();
  const hexInCss =
    /#(?:[\dA-Fa-f]{3}|[\dA-Fa-f]{4}|[\dA-Fa-f]{6}|[\dA-Fa-f]{8})\b/g;
  const rgbInCss = /rgba?\(\s*([^)]+)\)/gi;

  for (const match of css.matchAll(hexInCss)) {
    const key = hexToKey(match[0]);
    if (key) keys.add(key);
  }

  for (const match of css.matchAll(rgbInCss)) {
    const inner = match[1];
    if (!inner) continue;
    const key = rgbArgsToKey(inner);
    if (key) keys.add(key);
  }

  return keys;
}

export function joinStylesheetCss(
  stylesheets: ReadonlyArray<{ content: string }>,
): string {
  return stylesheets.map((sheet) => sheet.content).join("\n");
}

export function checkPaletteGrounding(
  css: string,
  palette: PaletteLike,
): GroundingResult {
  const cssKeys = collectCssColorKeys(css);
  const misses: string[] = [];
  const seen = new Set<string>();

  for (const group of palette.groups) {
    for (const entry of group.entries) {
      if (seen.has(entry.hex)) continue;
      seen.add(entry.hex);

      const key = canonicalColorKey(entry.hex);
      if (!key || !cssKeys.has(key)) {
        misses.push(entry.hex);
      }
    }
  }

  return { pass: misses.length === 0, misses };
}

function hexToKey(hex: string): string | null {
  const raw = hex.trim().replace(/^#/, "").toLowerCase();

  if (/^[\da-f]{3}$/.test(raw)) {
    return raw
      .split("")
      .map((ch) => `${ch}${ch}`)
      .join("");
  }

  if (/^[\da-f]{4}$/.test(raw)) {
    return raw
      .slice(0, 3)
      .split("")
      .map((ch) => `${ch}${ch}`)
      .join("");
  }

  if (/^[\da-f]{6}$/.test(raw)) {
    return raw;
  }

  if (/^[\da-f]{8}$/.test(raw)) {
    return raw.slice(0, 6);
  }

  return null;
}

function rgbArgsToKey(inner: string): string | null {
  const withoutAlpha = inner.replace(/\/\s*[\d.]+%?\s*$/, "").trim();
  const parts = withoutAlpha.includes(",")
    ? withoutAlpha.split(",")
    : withoutAlpha.split(/\s+/);

  if (parts.length < 3) return null;

  const r = cssChannel(parts[0]!);
  const g = cssChannel(parts[1]!);
  const b = cssChannel(parts[2]!);
  if (r === null || g === null || b === null) return null;

  return [r, g, b]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}

function cssChannel(token: string): number | null {
  const value = token.trim();
  if (value.endsWith("%")) {
    const pct = Number.parseFloat(value.slice(0, -1));
    if (!Number.isFinite(pct)) return null;
    const n = Math.round((pct / 100) * 255);
    return n < 0 || n > 255 ? null : n;
  }

  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded < 0 || rounded > 255 ? null : rounded;
}
