#!/usr/bin/env bun
/**
 * End-to-end smoke test: `bun run smoke.ts <url> [--out design.md]`.
 * Runs crawl -> (optional) screenshot -> extract -> synthesize -> render and
 * writes the resulting markdown to disk.
 */
import { writeFile } from "node:fs/promises";

import { runDesign } from "./src/runDesign";

async function main() {
  const args = process.argv.slice(2);
  const url = args.find((arg) => !arg.startsWith("--"));

  if (!url) {
    console.error("Usage: bun run smoke.ts <url> [--out design.md] [--full-page]");
    process.exit(1);
  }

  const outIndex = args.indexOf("--out");
  const outPath =
    outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1]! : "design.md";
  const captureFullPage = args.includes("--full-page");

  process.stderr.write(`[getdesign] running on ${url}\n`);

  const start = Date.now();
  const result = await runDesign(url, {
    captureFullPage,
    onPhase: (event) => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      switch (event.phase) {
        case "crawl":
          process.stderr.write(
            `[${elapsed}s] crawl: ${event.crawl.stylesheets.length} stylesheets from ${event.crawl.siteName}\n`,
          );
          break;
        case "visual":
          process.stderr.write(
            `[${elapsed}s] visual: ${event.visual.status}${
              event.visual.status !== "captured"
                ? ` (${event.visual.reason})`
                : ""
            }\n`,
          );
          break;
        case "extract":
          process.stderr.write(
            `[${elapsed}s] extract: ${event.tokens.typography.fontFamilies.length} font families, ${event.tokens.spacing.length} spacing steps\n`,
          );
          break;
        case "synthesize":
          process.stderr.write(
            `[${elapsed}s] synthesize: DesignDoc validated (${event.doc.palette.groups.length} palette groups)\n`,
          );
          break;
        case "render":
          process.stderr.write(
            `[${elapsed}s] render: ${event.markdown.length} chars of markdown\n`,
          );
          break;
      }
    },
  });

  await writeFile(outPath, result.markdown, "utf8");
  process.stderr.write(`[getdesign] wrote ${outPath}\n`);
}

main().catch((error) => {
  console.error("[getdesign] failed:", error);
  process.exit(1);
});
