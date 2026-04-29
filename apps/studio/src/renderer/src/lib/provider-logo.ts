/**
 * Map a Pi provider id (or OAuth display name) to one of the bundled provider
 * logos in `apps/studio/public/`. Returns `undefined` when there's no match,
 * so callers can decide whether to render a fallback glyph.
 */
type LogoEntry = { keywords: string[]; src: string; monochrome: boolean };

const LOGO_BY_KEYWORD: LogoEntry[] = [
  {
    keywords: ["antigravity"],
    src: "/antigravity.svg",
    monochrome: false,
  },
  { keywords: ["anthropic", "claude"], src: "/claude.svg", monochrome: false },
  { keywords: ["gemini", "google"], src: "/gemini.svg", monochrome: false },
  {
    keywords: ["copilot", "co-pilot", "github"],
    src: "/co-pilot.svg",
    monochrome: true,
  },
  {
    keywords: ["openai", "chatgpt", "codex", "gpt"],
    src: "/openai.svg",
    monochrome: true,
  },
];

export type ProviderLogoInfo = { src: string; monochrome: boolean };

export function getProviderLogo(
  providerId: string | undefined,
  providerLabel?: string,
): ProviderLogoInfo | undefined {
  const haystack = `${providerId ?? ""} ${providerLabel ?? ""}`.toLowerCase();
  if (!haystack.trim()) return undefined;
  for (const entry of LOGO_BY_KEYWORD) {
    if (entry.keywords.some((kw) => haystack.includes(kw))) {
      return { src: entry.src, monochrome: entry.monochrome };
    }
  }
  return undefined;
}

export function getProviderLogoSrc(
  providerId: string | undefined,
  providerLabel?: string,
): string | undefined {
  return getProviderLogo(providerId, providerLabel)?.src;
}
