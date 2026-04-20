import { load } from "cheerio";
import { z } from "zod";

const nonEmptyStringSchema = z.string().trim().min(1);
const DEFAULT_FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECT_HOPS = 5;
const DEFAULT_MAX_HTML_BYTES = 1_000_000;

const crawlableUrlSchema = z.string().trim().url().superRefine((value, ctx) => {
  const parsed = new URL(value);

  if (parsed.protocol !== "https:") {
    ctx.addIssue({
      code: "custom",
      message: "Only HTTPS URLs are supported.",
    });
  }

  if (isBlockedHostname(parsed.hostname)) {
    ctx.addIssue({
      code: "custom",
      message: "Private, localhost, and link-local targets are not allowed.",
    });
  }
});

const crawledStylesheetSchema = z
  .object({
    kind: z.enum(["linked", "imported", "inline"]),
    source: nonEmptyStringSchema,
    content: z.string(),
    url: z.string().url().optional(),
    importedFrom: z.string().url().optional(),
  })
  .strict();

const crawlSiteInputSchema = z
  .object({
    url: crawlableUrlSchema,
    maxStylesheetBytes: z.number().int().positive().max(1_000_000).default(200_000),
    maxImportDepth: z.number().int().min(0).max(3).default(1),
  })
  .strict();

export const crawlSiteResultSchema = z
  .object({
    sourceUrl: z.string().url(),
    siteName: nonEmptyStringSchema,
    html: z.string(),
    stylesheets: z.array(crawledStylesheetSchema),
    sourceUrls: z.array(z.string().url()).min(1),
    notes: z.array(nonEmptyStringSchema),
  })
  .strict();

export type CrawledStylesheet = z.infer<typeof crawledStylesheetSchema>;
export type StylesheetAsset = {
  url: string;
  css: string;
  kind: CrawledStylesheet["kind"];
  source: string;
  importedFrom?: string;
};
export type CrawlSiteResult = z.infer<typeof crawlSiteResultSchema>;
export type CrawlSiteInput = z.input<typeof crawlSiteInputSchema> & {
  fetch?: typeof fetch;
};

export function validatePublicUrl(url: string): string {
  return crawlableUrlSchema.parse(url);
}

export function extractStylesheetUrls(html: string, pageUrl: string): string[] {
  const safeHtml = z.string().parse(html);
  const baseUrl = crawlableUrlSchema.parse(pageUrl);
  const $ = load(safeHtml);
  const urls = new Set<string>();

  $('link[rel~="stylesheet"]').each((_, element) => {
    const href = $(element).attr("href");
    const resolved = resolveCrawlableUrl(href, baseUrl);

    if (resolved) {
      urls.add(resolved);
    }
  });

  return [...urls];
}

export function extractInlineStyles(html: string): string[] {
  const safeHtml = z.string().parse(html);
  const $ = load(safeHtml);
  const styles: string[] = [];

  $("style").each((_, element) => {
    const content = $(element).html()?.trim();

    if (content) {
      styles.push(content);
    }
  });

  return styles;
}

export function extractCssImportUrls(css: string, stylesheetUrl: string): string[] {
  const safeCss = z.string().parse(css);
  const baseUrl = crawlableUrlSchema.parse(stylesheetUrl);
  const urls = new Set<string>();
  const importPattern = /@import\s+(?:url\()?(?:"([^"]+)"|'([^']+)'|([^'")\s;]+))(?:\))?/gi;

  for (const match of safeCss.matchAll(importPattern)) {
    const rawUrl = match[1] ?? match[2] ?? match[3];
    const resolved = resolveCrawlableUrl(rawUrl, baseUrl);

    if (resolved) {
      urls.add(resolved);
    }
  }

  return [...urls];
}

export function deriveSiteName(html: string, pageUrl: string): string {
  const safeHtml = z.string().parse(html);
  const baseUrl = new URL(crawlableUrlSchema.parse(pageUrl));
  const $ = load(safeHtml);
  const candidates = [
    $('meta[property="og:site_name"]').attr("content"),
    $('meta[name="application-name"]').attr("content"),
    $("title").first().text(),
  ];

  for (const candidate of candidates) {
    const normalized = candidate?.trim();

    if (normalized) {
      const cleaned = normalized
        .replace(/\s*[|·—-]\s*.*/u, "")
        .trim();

      if (cleaned) {
        return cleaned;
      }
    }
  }

  return baseUrl.hostname.replace(/^www\./u, "");
}

export async function crawlSite(input: CrawlSiteInput): Promise<CrawlSiteResult> {
  const { fetch: customFetch, ...serializable } = input;
  const parsedInput = crawlSiteInputSchema.parse(serializable);
  const fetcher = customFetch ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    throw new Error("A fetch implementation is required to crawl a URL.");
  }

  const html = await fetchText(fetcher, parsedInput.url, {
    maxBytes: DEFAULT_MAX_HTML_BYTES,
  });
  const linkedStylesheets = extractStylesheetUrls(html, parsedInput.url);
  const inlineStyles = extractInlineStyles(html);
  const stylesheets: CrawledStylesheet[] = [];
  const seenUrls = new Set<string>([parsedInput.url]);

  for (const stylesheetUrl of linkedStylesheets) {
    const content = trimStylesheet(
      await fetchText(fetcher, stylesheetUrl, {
        maxBytes: parsedInput.maxStylesheetBytes,
      }),
      parsedInput.maxStylesheetBytes,
    );

    stylesheets.push({
      kind: "linked",
      source: stylesheetUrl,
      content,
      url: stylesheetUrl,
    });
    seenUrls.add(stylesheetUrl);

    const importedStylesheets = await fetchImportedStylesheets({
      fetcher,
      stylesheetUrl,
      css: content,
      maxBytes: parsedInput.maxStylesheetBytes,
      maxDepth: parsedInput.maxImportDepth,
      visited: seenUrls,
    });

    stylesheets.push(...importedStylesheets);
  }

  inlineStyles.forEach((content, index) => {
    stylesheets.push({
      kind: "inline",
      source: `inline-style-${index + 1}`,
      content: trimStylesheet(content, parsedInput.maxStylesheetBytes),
    });
  });

  const notes = [
    `Fetched ${linkedStylesheets.length} linked stylesheet${linkedStylesheets.length === 1 ? "" : "s"}.`,
    `Captured ${inlineStyles.length} inline style block${inlineStyles.length === 1 ? "" : "s"}.`,
  ];

  if (stylesheets.length === 0) {
    notes.push("No crawlable stylesheets were discovered in the HTML document.");
  }

  return crawlSiteResultSchema.parse({
    sourceUrl: parsedInput.url,
    siteName: deriveSiteName(html, parsedInput.url),
    html,
    stylesheets,
    sourceUrls: [...seenUrls],
    notes,
  });
}

export function toStylesheetAssets(
  result: CrawlSiteResult,
): StylesheetAsset[] {
  const parsed = crawlSiteResultSchema.parse(result);

  return parsed.stylesheets
    .filter((stylesheet): stylesheet is CrawledStylesheet & { url: string } =>
      Boolean(stylesheet.url),
    )
    .map((stylesheet) => ({
      url: stylesheet.url,
      css: stylesheet.content,
      kind: stylesheet.kind,
      source: stylesheet.source,
      importedFrom: stylesheet.importedFrom,
    }));
}

async function fetchImportedStylesheets(input: {
  fetcher: typeof fetch;
  stylesheetUrl: string;
  css: string;
  maxBytes: number;
  maxDepth: number;
  visited: Set<string>;
  depth?: number;
}): Promise<CrawledStylesheet[]> {
  const depth = input.depth ?? 0;

  if (depth >= input.maxDepth) {
    return [];
  }

  const importedUrls = extractCssImportUrls(input.css, input.stylesheetUrl);
  const imported: CrawledStylesheet[] = [];

  for (const importedUrl of importedUrls) {
    if (input.visited.has(importedUrl)) {
      continue;
    }

    input.visited.add(importedUrl);
    const content = trimStylesheet(
      await fetchText(input.fetcher, importedUrl, {
        maxBytes: input.maxBytes,
      }),
      input.maxBytes,
    );

    imported.push({
      kind: "imported",
      source: importedUrl,
      content,
      url: importedUrl,
      importedFrom: input.stylesheetUrl,
    });

    const nested = await fetchImportedStylesheets({
      ...input,
      stylesheetUrl: importedUrl,
      css: content,
      depth: depth + 1,
    });

    imported.push(...nested);
  }

  return imported;
}

async function fetchText(
  fetcher: typeof fetch,
  url: string,
  options: {
    maxBytes: number;
    timeoutMs?: number;
    maxRedirectHops?: number;
  },
): Promise<string> {
  let currentUrl = validatePublicUrl(url);
  const timeoutMs = options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const maxRedirectHops = options.maxRedirectHops ?? DEFAULT_MAX_REDIRECT_HOPS;

  for (let hop = 0; hop <= maxRedirectHops; hop += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;

    try {
      response = await fetcher(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Timed out fetching ${currentUrl} after ${timeoutMs}ms.`);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const nextUrl = resolveCrawlableUrl(location ?? undefined, currentUrl);

      if (!nextUrl) {
        throw new Error(`Blocked redirect target while fetching ${currentUrl}.`);
      }

      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${currentUrl}: ${response.status} ${response.statusText}`);
    }

    return await readResponseText(response, currentUrl, options.maxBytes);
  }

  throw new Error(`Too many redirects while fetching ${url}.`);
}

async function readResponseText(
  response: Response,
  url: string,
  maxBytes: number,
): Promise<string> {
  if (!response.body) {
    const text = await response.text();

    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new Error(`Response from ${url} exceeded ${maxBytes} bytes.`);
    }

    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error(`Response from ${url} exceeded ${maxBytes} bytes.`);
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

function trimStylesheet(content: string, maxBytes: number): string {
  const buffer = Buffer.from(content, "utf8");

  if (buffer.byteLength <= maxBytes) {
    return content;
  }

  return buffer.subarray(0, maxBytes).toString("utf8");
}

function resolveCrawlableUrl(rawUrl: string | undefined, baseUrl: string): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();

  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return null;
  }

  let resolved: URL;

  try {
    resolved = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }

  if (resolved.protocol !== "https:" || isBlockedHostname(resolved.hostname)) {
    return null;
  }

  return resolved.toString();
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (isPrivateIpv4(normalized)) {
    return true;
  }

  return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(hostname);

  if (!match) {
    return false;
  }

  const octets = match.slice(1).map(Number);

  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const first = octets[0];
  const second = octets[1];

  if (first === undefined || second === undefined) {
    return false;
  }

  return (
    first === 0 ||
    first === 10 ||
    (first === 100 && second >= 64 && second <= 127) ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}
