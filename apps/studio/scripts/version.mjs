#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(here, "..", "package.json");

const bump = process.argv[2];
if (!["patch", "minor", "major"].includes(bump)) {
  console.error("usage: version.mjs <patch|minor|major>");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [maj, min, pat] = pkg.version.split(".").map(Number);
const next =
  bump === "major"
    ? `${maj + 1}.0.0`
    : bump === "minor"
      ? `${maj}.${min + 1}.0`
      : `${maj}.${min}.${pat + 1}`;

pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const tag = `studio-v${next}`;
const repoRoot = execSync("git rev-parse --show-toplevel").toString().trim();

execSync(`git -C "${repoRoot}" add apps/studio/package.json`, { stdio: "inherit" });
execSync(`git -C "${repoRoot}" commit -m "chore(studio): release ${tag}"`, { stdio: "inherit" });
execSync(`git -C "${repoRoot}" tag ${tag}`, { stdio: "inherit" });

console.log(`\n✓ bumped studio to ${next}`);
console.log(`✓ tagged ${tag}`);
console.log(`\nnext: git push origin main --tags`);
