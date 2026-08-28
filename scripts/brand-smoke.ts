#!/usr/bin/env bun
/**
 * M11 brand smoke (local / manual). Does not run on push/PR.
 *
 *   bun ./scripts/brand-smoke.ts [--limit N] [--text-only] [--out dir]
 *
 * Default requires visual capture (DAYTONA_API_KEY + OPENAI_API_KEY).
 * `--text-only` uses visualRequirement `text_only_fallback` (OPENAI_API_KEY).
 * Outputs go to getdesign-runs/brand-smoke/<timestamp>/ and must not be committed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { runDesign, RunDesignError } from "../packages/agent/src/runDesign.ts";

import {
  BRANDS,
  formatDuration,
  formatResultTable,
  medianMs,
  parseBrandSmokeArgs,
  type BrandResult,
  type BrandSmokeArgs,
} from "./brand-smoke/cli.ts";
import {
  checkPaletteGrounding,
  joinStylesheetCss,
} from "./brand-smoke/grounding.ts";

const P50_BUDGET_MS = 90_000;

function loadEnvLocal(): void {
  const candidates = [
    resolve(import.meta.dir, "../.env.local"),
    resolve(process.cwd(), ".env.local"),
  ];

  for (const path of candidates) {
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }

    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2]!;
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]!]) process.env[m[1]!] = val;
    }
  }
}

function usage(): string {
  return `Usage: bun ./scripts/brand-smoke.ts [--limit N] [--text-only] [--out dir]

Default requires visual capture (DAYTONA_API_KEY + OPENAI_API_KEY).
--text-only uses text_only_fallback (still needs OPENAI_API_KEY).
--out defaults to getdesign-runs/brand-smoke/<timestamp>/
`;
}

function timestampStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function smokeBrand(
  brand: (typeof BRANDS)[number],
  textOnly: boolean,
  brandDir: string,
): Promise<BrandResult> {
  const start = Date.now();
  try {
    const result = await runDesign(brand.url, {
      visualRequirement: textOnly ? "text_only_fallback" : "require",
      onPhase: (event) => {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        if (event.phase === "crawl" && event.status === "ok") {
          process.stderr.write(
            `[${elapsed}s] ${brand.name}: crawl ${event.crawl.stylesheets.length} sheets\n`,
          );
          return;
        }
        if (event.phase === "synthesize" && event.status === "ok") {
          process.stderr.write(
            `[${elapsed}s] ${brand.name}: ${event.doc.palette.groups.length} palette groups\n`,
          );
        }
      },
    });

    const grounding = checkPaletteGrounding(
      joinStylesheetCss(result.crawl.stylesheets),
      result.doc.palette,
    );

    await mkdir(brandDir, { recursive: true });
    await writeFile(resolve(brandDir, "design.md"), result.markdown, "utf8");

    const row: BrandResult = {
      brand: brand.name,
      url: brand.url,
      status: grounding.pass ? "ok" : "fail",
      durationMs: Date.now() - start,
      mode: result.mode,
      tileCount: result.tiles,
      groundingPass: grounding.pass,
      groundingMisses: grounding.misses,
      ...(grounding.pass
        ? {}
        : {
            error: `palette hex missing from crawled CSS: ${grounding.misses.join(", ")}`,
          }),
    };

    await writeFile(
      resolve(brandDir, "result.json"),
      `${JSON.stringify(row, null, 2)}\n`,
      "utf8",
    );
    return row;
  } catch (error) {
    const message =
      error instanceof RunDesignError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);

    const row: BrandResult = {
      brand: brand.name,
      url: brand.url,
      status: "fail",
      error: message,
      durationMs: Date.now() - start,
      mode: null,
      tileCount: 0,
      groundingPass: false,
      groundingMisses: [],
    };

    await mkdir(brandDir, { recursive: true });
    await writeFile(
      resolve(brandDir, "result.json"),
      `${JSON.stringify(row, null, 2)}\n`,
      "utf8",
    );
    return row;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  let args: BrandSmokeArgs;
  try {
    args = parseBrandSmokeArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.stderr.write(usage());
    process.exit(1);
  }

  if (args.help) {
    process.stderr.write(usage());
    process.exit(0);
  }

  if (!process.env.OPENAI_API_KEY) {
    process.stderr.write(
      "[brand-smoke] OPENAI_API_KEY is required (even with --text-only).\n",
    );
    process.exit(1);
  }

  if (!args.textOnly && !process.env.DAYTONA_API_KEY) {
    process.stderr.write(
      "[brand-smoke] DAYTONA_API_KEY is required unless you pass --text-only.\n",
    );
    process.exit(1);
  }

  const selected = BRANDS.slice(0, Math.min(args.limit, BRANDS.length));
  const outDir = resolve(
    process.cwd(),
    args.out ?? `getdesign-runs/brand-smoke/${timestampStamp()}`,
  );
  await mkdir(outDir, { recursive: true });

  process.stderr.write(
    `[brand-smoke] ${selected.length} brand${selected.length === 1 ? "" : "s"} → ${outDir}${
      args.textOnly ? " (text-only)" : ""
    }\n`,
  );

  const results: BrandResult[] = [];
  for (const [index, brand] of selected.entries()) {
    process.stderr.write(
      `[brand-smoke] ${index + 1}/${selected.length} ${brand.name} ${brand.url}\n`,
    );
    const row = await smokeBrand(brand, args.textOnly, resolve(outDir, brand.name));
    results.push(row);
    process.stderr.write(
      `[brand-smoke] ${brand.name} ${row.status} ${formatDuration(row.durationMs)} grounding=${
        row.groundingPass ? "pass" : "fail"
      } mode=${row.mode ?? "-"}\n`,
    );
  }

  const p50Ms = medianMs(results.map((row) => row.durationMs));
  const failed = results.filter((row) => row.status === "fail").length;
  const summary = {
    startedAt: new Date().toISOString(),
    outDir,
    textOnly: args.textOnly,
    limit: selected.length,
    p50Ms,
    p50Warning: p50Ms !== null && p50Ms > P50_BUDGET_MS,
    passed: results.length - failed,
    failed,
    results,
  };

  await writeFile(
    resolve(outDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  process.stderr.write(`\n${formatResultTable(results)}\n`);
  if (p50Ms !== null) {
    process.stderr.write(`[brand-smoke] P50 ${formatDuration(p50Ms)} (${p50Ms}ms)\n`);
    if (p50Ms > P50_BUDGET_MS) {
      process.stderr.write(
        `[brand-smoke] warning: P50 ${p50Ms}ms exceeds ${P50_BUDGET_MS}ms (G5 is aspirational; not failing)\n`,
      );
    }
  }
  process.stderr.write(`[brand-smoke] wrote ${resolve(outDir, "summary.json")}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("[brand-smoke] failed:", error);
    process.exit(1);
  });
}
