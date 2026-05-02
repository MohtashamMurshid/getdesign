#!/usr/bin/env bun
/**
 * End-to-end smoke test:
 *   `bun run smoke.ts <url> [--out design.md] [--text-only]`.
 *
 * Runs crawl -> capture -> extract -> synthesize -> render and writes the
 * resulting markdown to disk.
 *
 * `--text-only` opts into the text-only fallback when Daytona capture is
 * unavailable, instead of failing with `RunDesignError`.
 */
import { writeFile } from "node:fs/promises";

import { runDesign, RunDesignError } from "./src/runDesign";

async function main() {
  const args = process.argv.slice(2);
  const url = args.find((arg) => !arg.startsWith("--"));

  if (!url) {
    console.error(
      "Usage: bun run smoke.ts <url> [--out design.md] [--text-only]",
    );
    process.exit(1);
  }

  const outIndex = args.indexOf("--out");
  const outPath =
    outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1]! : "design.md";
  const textOnly = args.includes("--text-only");

  process.stderr.write(`[getdesign] running on ${url}\n`);

  const start = Date.now();
  try {
    const result = await runDesign(url, {
      visualRequirement: textOnly ? "text_only_fallback" : "require",
      onPhase: (event) => {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        switch (event.phase) {
          case "crawl":
            if (event.status === "start") {
              process.stderr.write(`[${elapsed}s] crawl: reading site\n`);
            } else {
              process.stderr.write(
                `[${elapsed}s] crawl: ${event.crawl.stylesheets.length} stylesheets from ${event.crawl.siteName}\n`,
              );
            }
            break;
          case "capture":
            process.stderr.write(
              `[${elapsed}s] capture.${event.event.phase}: ${event.event.status}${
                event.event.detail ? ` — ${event.event.detail}` : ""
              }\n`,
            );
            break;
          case "visual":
            if (event.status === "start") {
              process.stderr.write(`[${elapsed}s] visual: capturing page\n`);
            } else {
              process.stderr.write(
                `[${elapsed}s] visual: ${event.visual.status}${
                  event.visual.status !== "captured" && "reason" in event.visual
                    ? ` (${event.visual.reason})`
                    : ""
                }\n`,
              );
            }
            break;
          case "extract":
            if (event.status === "start") {
              process.stderr.write(`[${elapsed}s] extract: deriving tokens\n`);
            } else {
              process.stderr.write(
                `[${elapsed}s] extract: ${event.tokens.typography.fontFamilies.length} font families, ${event.tokens.spacing.length} spacing steps\n`,
              );
            }
            break;
          case "synthesize":
            if (event.status === "start") {
              process.stderr.write(`[${elapsed}s] synthesize: drafting design.md\n`);
            } else {
              process.stderr.write(
                `[${elapsed}s] synthesize: DesignDoc validated (${event.doc.palette.groups.length} palette groups)\n`,
              );
            }
            break;
          case "render":
            if (event.status === "start") {
              process.stderr.write(`[${elapsed}s] render: formatting markdown\n`);
            } else {
              process.stderr.write(
                `[${elapsed}s] render: ${event.markdown.length} chars of markdown\n`,
              );
            }
            break;
        }
      },
    });

    await writeFile(outPath, result.markdown, "utf8");
    process.stderr.write(
      `[getdesign] wrote ${outPath} (mode=${result.mode})\n`,
    );
  } catch (error) {
    if (error instanceof RunDesignError) {
      process.stderr.write(
        `[getdesign] capture failed: ${error.message}\n`,
      );
      process.stderr.write(
        `[getdesign] re-run with --text-only to accept a text-only design.md.\n`,
      );
      process.exit(2);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("[getdesign] failed:", error);
  process.exit(1);
});
