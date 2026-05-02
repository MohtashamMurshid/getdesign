import { existsSync } from "node:fs";
import { extname, isAbsolute, join, resolve } from "node:path";

export function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function defaultOutputPath(cwd: string, url: string, siteName?: string): string {
  const source = siteName || new URL(url).hostname.replace(/^www\./, "");
  return resolve(cwd, "getdesign-runs", slugify(source) || "design", "design.md");
}

/**
 * Resolve final markdown path. `--out` as file writes there; directory or trailing slash writes design.md inside.
 */
export function resolveOutputPath(
  cwd: string,
  out: string | undefined,
  url: string,
  siteName?: string,
): string {
  if (!out) return defaultOutputPath(cwd, url, siteName);

  const target = isAbsolute(out) ? out : resolve(cwd, out);
  if (extname(target)) return target;
  if (existsSync(target)) return join(target, "design.md");

  return out.endsWith("/") || out.endsWith("\\") ? join(target, "design.md") : target;
}
