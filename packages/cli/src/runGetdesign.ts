import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { GetDesignError, streamDesign } from "@getdesign/sdk";

import { parseArgs, usage } from "./lib/parseArgs.js";
import { normalizeUrl, resolveOutputPath } from "./lib/outputPath.js";
import { ProgressDisplay } from "./lib/progressDisplay.js";
import { readCliPackageVersion } from "./lib/version.js";

const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

export type RunGetdesignCliInput = {
  /** argv after executable (default: process.argv.slice(2)) */
  argv?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
};

function elapsed(start: number, now: () => number): string {
  return `${((now() - start) / 1000).toFixed(1)}s`;
}

/**
 * Single seam for the CLI: parse → validate keys → runDesign → write markdown.
 * The entry script stays a thin adapter (signal handling, exit codes only).
 */
export async function runGetdesignCli(input: RunGetdesignCliInput = {}): Promise<void> {
  const argv = input.argv ?? process.argv.slice(2);
  const cwd = input.cwd ?? process.cwd();
  const env = input.env ?? process.env;
  const now = input.now ?? Date.now;

  const options = parseArgs(argv);

  if (options.version) {
    console.log(readCliPackageVersion());
    return;
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  const url = normalizeUrl(options.url);
  if (!url) {
    throw new Error("Missing source URL. Run `getdesign --help` for usage.");
  }

  const daytonaApiKey = options.daytonaApiKey ?? env.DAYTONA_API_KEY;
  const openaiApiKey = options.openaiApiKey ?? env.OPENAI_API_KEY;
  if (!daytonaApiKey) {
    throw new Error("Missing Daytona API key. Pass --daytona-api-key or set DAYTONA_API_KEY.");
  }
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key. Pass --openai-api-key or set OPENAI_API_KEY.");
  }

  const target = resolveOutputPath(cwd, options.out, url, options.siteName);
  console.error(`${DIM}getdesign: running ${url}${RESET}`);
  console.error(`${DIM}getdesign: output ${target}${RESET}`);

  const start = now();
  const progress = new ProgressDisplay(start, now);
  let markdown: string | undefined;

  for await (const event of streamDesign(url, {
    siteName: options.siteName,
    visualRequirement: options.visualRequirement,
    credentials: { daytonaApiKey, openaiApiKey },
  })) {
    if (event.type === "progress") progress.event(event.event);
    if (event.type === "error") {
      throw new GetDesignError(200, event.error);
    }
    if (event.type === "result") {
      markdown = event.result.markdown;
    }
  }
  progress.stop();

  if (!markdown) {
    throw new Error("API stream ended without a design result.");
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, markdown, "utf8");
  console.error(`${GREEN}[${elapsed(start, now)}] getdesign: wrote ${target}${RESET}`);
}

export { GetDesignError };
