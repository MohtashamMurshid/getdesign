#!/usr/bin/env bun
/**
 * End-to-end smoke for the Daytona Computer Use capture pipeline.
 *
 * Runs the full runDesign pipeline (crawl + capture + describe + extract +
 * synthesize + render) against a target URL and prints phase events, the
 * full visual description (the headline output now), and a markdown
 * excerpt. Reads OPENAI_API_KEY and DAYTONA_API_KEY from the repo-root
 * .env.local without pulling in dotenv.
 *
 *   bun run packages/agent/smoke-pipeline.ts <url> [--measurement cdp|visual|auto]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { runDesign, RunDesignError } from "./src/runDesign";

function loadEnvLocal(): void {
  const candidates = [
    resolve(import.meta.dir, "../../.env.local"),
    resolve(import.meta.dir, ".env.local"),
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

function maskKey(key: string | undefined): string {
  if (!key) return "<missing>";
  if (key.length < 8) return "***";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function slugForUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "example.com") return "example";
    if (host.endsWith("ycombinator.com")) return "hn";
    return host.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  } catch {
    return "page";
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const args = process.argv.slice(2);
  const url = args.find((a) => !a.startsWith("--")) ?? "https://example.com";
  const measurementIdx = args.indexOf("--measurement");
  const measurementMode = (measurementIdx >= 0
    ? args[measurementIdx + 1]
    : undefined) as "cdp" | "visual" | "auto" | undefined;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const daytonaApiKey = process.env.DAYTONA_API_KEY;
  if (!openaiApiKey || !daytonaApiKey) {
    console.error(
      `Missing keys. OPENAI_API_KEY=${maskKey(openaiApiKey)} DAYTONA_API_KEY=${maskKey(daytonaApiKey)}`,
    );
    process.exit(1);
  }

  console.error(`[smoke] target: ${url}`);
  console.error(`[smoke] OPENAI_API_KEY=${maskKey(openaiApiKey)} DAYTONA_API_KEY=${maskKey(daytonaApiKey)}`);
  if (measurementMode) console.error(`[smoke] measurementMode=${measurementMode}`);

  const start = Date.now();

  try {
    const result = await runDesign(url, {
      credentials: { openaiApiKey, daytonaApiKey },
      measurementMode,
      onPhase: (event) => {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        switch (event.phase) {
          case "crawl":
            console.error(
              `[${elapsed}s] crawl: ${event.crawl.stylesheets.length} stylesheets from ${event.crawl.siteName}`,
            );
            break;
          case "capture":
            console.error(
              `[${elapsed}s] capture.${event.event.phase}: ${event.event.status}${
                event.event.detail ? ` — ${event.event.detail}` : ""
              }${
                event.event.durationMs ? ` (${event.event.durationMs}ms)` : ""
              }`,
            );
            break;
          case "visual":
            console.error(`[${elapsed}s] visual: ${event.visual.status}`);
            break;
          case "describe":
            console.error(
              `[${elapsed}s] describe: ${event.status}${
                event.detail ? ` — ${event.detail}` : ""
              }`,
            );
            break;
          case "extract":
            console.error(
              `[${elapsed}s] extract: ${event.tokens.typography.fontFamilies.length} font families`,
            );
            break;
          case "synthesize":
            console.error(
              `[${elapsed}s] synthesize: doc validated (${event.doc.palette.groups.length} palette groups)`,
            );
            break;
          case "render":
            console.error(
              `[${elapsed}s] render: ${event.markdown.length} chars`,
            );
            break;
        }
      },
    });

    console.error("\n[smoke] capture summary:");
    if (result.visual.status === "captured") {
      const v = result.visual;
      console.error(`  tiles:           ${v.tiles.length}`);
      console.error(`  documentHeight:  ${v.documentHeight}px`);
      console.error(`  documentWidth:   ${v.documentWidth}px`);
      console.error(`  measurementMode: ${v.measurementMode}`);
      console.error(`  i18nFontsInstalled: ${v.installedI18nFonts}`);
      console.error(`  durations(ms):   ${JSON.stringify(v.durationsMs)}`);
    } else {
      console.error(`  visual.status: ${result.visual.status}`);
    }

    if (result.visualDescription) {
      const wordCount = result.visualDescription
        .split(/\s+/)
        .filter(Boolean).length;
      console.error(
        `\n[smoke] visualDescription: ${wordCount} words, ${result.visualDescription.length} chars`,
      );
      try {
        const dir = "/tmp/getdesign-smoke";
        mkdirSync(dir, { recursive: true });
        const path = `${dir}/${slugForUrl(url)}-description.md`;
        writeFileSync(path, result.visualDescription, "utf8");
        console.error(`[smoke] description written to ${path}`);
      } catch (err) {
        console.error(`[smoke] failed to write description: ${err}`);
      }
      console.error("\n[smoke] visualDescription (full):\n");
      console.error(result.visualDescription);
    } else {
      console.error("\n[smoke] visualDescription: <none>");
    }

    console.error(`\n[smoke] mode: ${result.mode}`);
    console.error(`[smoke] tiles: ${result.tiles}`);
    console.error(`[smoke] total elapsed: ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.error("\n[smoke] markdown excerpt:");
    const lines = result.markdown.split("\n").slice(0, 12);
    for (const line of lines) console.error(`  ${line}`);
    console.error(`  ... (${result.markdown.length} total chars)`);
  } catch (error) {
    if (error instanceof RunDesignError) {
      console.error(`[smoke] capture_failed: ${error.message}`);
      process.exit(2);
    }
    console.error("[smoke] FAILED:", error);
    process.exit(3);
  }
}

main();
