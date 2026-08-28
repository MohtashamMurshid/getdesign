export const BRANDS = [
  { name: "cursor", url: "https://cursor.com" },
  { name: "linear", url: "https://linear.app" },
  { name: "vercel", url: "https://vercel.com" },
  { name: "stripe", url: "https://stripe.com" },
  { name: "notion", url: "https://notion.so" },
  { name: "figma", url: "https://figma.com" },
  { name: "raycast", url: "https://raycast.com" },
  { name: "github", url: "https://github.com" },
  { name: "openai", url: "https://openai.com" },
  { name: "anthropic", url: "https://anthropic.com" },
  { name: "resend", url: "https://resend.com" },
  { name: "clerk", url: "https://clerk.com" },
  { name: "workos", url: "https://workos.com" },
  { name: "convex", url: "https://convex.dev" },
  { name: "supabase", url: "https://supabase.com" },
  { name: "tailwindcss", url: "https://tailwindcss.com" },
  { name: "framer", url: "https://framer.com" },
  { name: "apple", url: "https://apple.com" },
  { name: "bun", url: "https://bun.sh" },
  { name: "expo", url: "https://expo.dev" },
] as const;

export type BrandSmokeArgs = {
  limit: number;
  textOnly: boolean;
  out?: string;
  help: boolean;
};

export type BrandResult = {
  brand: string;
  url: string;
  status: "ok" | "fail";
  error?: string;
  durationMs: number;
  mode: "visual" | "text_only" | null;
  tileCount: number;
  groundingPass: boolean;
  groundingMisses: string[];
};

export function parseBrandSmokeArgs(argv: string[]): BrandSmokeArgs {
  const parsed: BrandSmokeArgs = {
    limit: BRANDS.length,
    textOnly: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token) continue;

    if (token === "--help" || token === "-h") {
      parsed.help = true;
      continue;
    }

    if (token === "--text-only") {
      parsed.textOnly = true;
      continue;
    }

    if (token === "--limit") {
      const raw = argv[i + 1];
      if (!raw || raw.startsWith("-")) {
        throw new Error("--limit requires a positive integer.");
      }
      const n = Number.parseInt(raw, 10);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`--limit must be a positive integer, got ${raw}`);
      }
      parsed.limit = n;
      i += 1;
      continue;
    }

    if (token === "--out") {
      const raw = argv[i + 1];
      if (!raw || raw.startsWith("-")) {
        throw new Error("--out requires a directory path.");
      }
      parsed.out = raw;
      i += 1;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return parsed;
}

export function medianMs(durations: readonly number[]): number | null {
  if (durations.length === 0) return null;
  const sorted = [...durations].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatResultTable(results: readonly BrandResult[]): string {
  const headers = ["brand", "status", "duration", "grounding", "mode"] as const;
  const rows = results.map((row) => [
    row.brand,
    row.status,
    formatDuration(row.durationMs),
    row.groundingPass
      ? "pass"
      : row.error && row.groundingMisses.length === 0
        ? "n/a"
        : `fail${row.groundingMisses.length > 0 ? `(${row.groundingMisses.length})` : ""}`,
    row.mode ?? "-",
  ]);

  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]!.length)),
  );

  const line = (cells: readonly string[]) =>
    cells.map((cell, index) => cell.padEnd(widths[index]!)).join("  ");

  return [line([...headers]), ...rows.map((row) => line(row))].join("\n");
}
