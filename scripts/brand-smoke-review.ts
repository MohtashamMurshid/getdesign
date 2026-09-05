#!/usr/bin/env bun
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  evaluateHumanReview,
  type HumanReviewFile,
} from "./brand-smoke/review";

async function main() {
  const input = process.argv[2];
  if (!input) {
    process.stderr.write(
      "Usage: bun ./scripts/brand-smoke-review.ts <human-review.json>\n",
    );
    process.exit(1);
  }

  const path = resolve(process.cwd(), input);
  const review = JSON.parse(await readFile(path, "utf8")) as HumanReviewFile;
  const result = evaluateHumanReview(review);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.complete) {
    process.stderr.write(
      "Human review is incomplete. Rate 20 unique brands before applying the M3 gate.\n",
    );
    process.exit(1);
  }
  if (!result.pass) {
    process.stderr.write(
      `M3 failed: ${result.correct}/20 palettes were rated correct; 18 are required.\n`,
    );
    process.exit(1);
  }

  process.stdout.write(
    `M3 passed: ${result.correct}/20 palettes were rated correct.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
