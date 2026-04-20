#!/usr/bin/env node
// @getdesign/cli — placeholder. Coming soon.
// Project: https://getdesign.app

const GREEN = "\x1b[38;2;163;230;53m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const args = process.argv.slice(2);
const wantsVersion = args.includes("--version") || args.includes("-v");
const wantsHelp = args.includes("--help") || args.includes("-h");

if (wantsVersion) {
  // Read version from package.json at install time
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(join(here, "..", "package.json"), "utf8"),
  );
  console.log(pkg.version);
  process.exit(0);
}

const banner = `
${GREEN}   ◆  getdesign${RESET}  ${DIM}— the design system for any URL${RESET}

  ${BOLD}Coming soon.${RESET}  The CLI, SDK, and API are in private beta.

  ${DIM}→${RESET} Join the waitlist at  ${GREEN}https://getdesign.app${RESET}
  ${DIM}→${RESET} Follow on GitHub       ${GREEN}https://github.com/getdesign${RESET}

  ${DIM}Usage (preview):${RESET}
    $ npx @getdesign/cli <url>
    $ npx @getdesign/cli cursor.com --out design.md
`;

console.log(banner);

if (args.length && !wantsHelp) {
  const url = args.find((a) => !a.startsWith("-"));
  if (url) {
    console.log(`  ${DIM}You asked for:${RESET} ${url}`);
    console.log(`  ${DIM}We'll email you the moment extraction opens up.${RESET}\n`);
  }
}

process.exit(0);
