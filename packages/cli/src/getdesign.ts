#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { RunDesignError, runDesign, type RunDesignEvent } from "@getdesign/agent";

const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

type CliOptions = {
  help?: boolean;
  version?: boolean;
  url?: string;
  siteName?: string;
  out?: string;
  daytonaApiKey?: string;
  openaiApiKey?: string;
  visualRequirement: "require" | "text_only_fallback";
};

const args = process.argv.slice(2);

function usage() {
  return `getdesign — generate a design.md from any public URL

Usage:
  getdesign <url> [options]
  getdesign --url <url> [options]

Options:
  --url <url>                 Source URL to analyze
  --site-name <name>          Override the detected site name
  --out <path>                Output file or directory (default: ./getdesign-runs/<slug>/design.md)
  --daytona-api-key <key>     Daytona key for this run (or DAYTONA_API_KEY)
  --openai-api-key <key>      OpenAI key for this run (or OPENAI_API_KEY)
  --text-only-fallback        Continue if visual capture is unavailable
  --help, -h                  Show help
  --version, -v               Show version

Examples:
  getdesign https://linear.app
  getdesign https://linear.app --out design.md
  getdesign --url https://cursor.com --site-name Cursor --out ./designs
  DAYTONA_API_KEY=... OPENAI_API_KEY=... getdesign https://example.com
`;
}

function readVersion() {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
  return String(pkg.version);
}

function takeValue(tokens: string[], index: number, flag: string) {
  const value = tokens[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function parseArgs(tokens: string[]): CliOptions {
  const options: CliOptions = {
    visualRequirement: "require",
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token) continue;

    if (token === "--help" || token === "-h") options.help = true;
    else if (token === "--version" || token === "-v") options.version = true;
    else if (token === "--text-only-fallback") {
      options.visualRequirement = "text_only_fallback";
    } else if (token === "--url") {
      options.url = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--site-name") {
      options.siteName = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--out") {
      options.out = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--daytona-api-key") {
      options.daytonaApiKey = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--openai-api-key") {
      options.openaiApiKey = takeValue(tokens, i, token);
      i += 1;
    } else if (token.startsWith("-")) {
      throw new Error(`Unknown option: ${token}`);
    } else if (!options.url) {
      options.url = token;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }

  return options;
}

function normalizeUrl(value: string | undefined) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function defaultOutputPath(url: string, siteName?: string) {
  const source = siteName || new URL(url).hostname.replace(/^www\./, "");
  return resolve(process.cwd(), "getdesign-runs", slugify(source) || "design", "design.md");
}

function outputPath(out: string | undefined, url: string, siteName?: string) {
  if (!out) return defaultOutputPath(url, siteName);

  const target = isAbsolute(out) ? out : resolve(process.cwd(), out);
  if (extname(target)) return target;
  if (existsSync(target)) return join(target, "design.md");

  return out.endsWith("/") || out.endsWith("\\") ? join(target, "design.md") : target;
}

function summarizeEvent(event: RunDesignEvent) {
  if (event.phase === "crawl") {
    return event.status === "start"
      ? "crawl: reading site"
      : `crawl: found ${event.crawl.sourceUrls.length} source${event.crawl.sourceUrls.length === 1 ? "" : "s"}`;
  }

  if (event.phase === "capture") return `capture: ${event.event.phase}`;
  if (event.phase === "visual") {
    return event.status === "start" ? "visual: capturing page" : `visual: ${event.visual.status}`;
  }
  if (event.phase === "describe") {
    return event.detail ? `describe: ${event.status} (${event.detail})` : `describe: ${event.status}`;
  }
  if (event.phase === "extract") {
    return event.status === "start" ? "extract: deriving tokens" : "extract: ok";
  }
  if (event.phase === "synthesize") {
    return event.status === "start" ? "synthesize: drafting design.md" : "synthesize: ok";
  }
  if (event.phase === "render") {
    return event.status === "start" ? "render: formatting markdown" : "render: ok";
  }
}

function logProgress(event: RunDesignEvent) {
  console.error(`${DIM}getdesign: ${summarizeEvent(event)}${RESET}`);
}

async function main() {
  const options = parseArgs(args);

  if (options.version) {
    console.log(readVersion());
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

  const daytonaApiKey = options.daytonaApiKey ?? process.env.DAYTONA_API_KEY;
  const openaiApiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY;
  if (!daytonaApiKey) {
    throw new Error("Missing Daytona API key. Pass --daytona-api-key or set DAYTONA_API_KEY.");
  }
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key. Pass --openai-api-key or set OPENAI_API_KEY.");
  }

  const target = outputPath(options.out, url, options.siteName);
  console.error(`${DIM}getdesign: running ${url}${RESET}`);
  console.error(`${DIM}getdesign: output ${target}${RESET}`);

  const result = await runDesign(url, {
    siteName: options.siteName,
    visualRequirement: options.visualRequirement,
    credentials: { daytonaApiKey, openaiApiKey },
    onPhase: logProgress,
  });

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, result.markdown, "utf8");
  console.error(`${GREEN}getdesign: wrote ${target}${RESET}`);
}

try {
  await main();
} catch (error) {
  const message =
    error instanceof RunDesignError
      ? `Visual capture failed: ${error.message}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error(`${RED}getdesign: ${message}${RESET}`);
  process.exit(1);
}
