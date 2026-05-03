#!/usr/bin/env bun
import { GetDesignError, runGetdesignCli } from "./runGetdesign";

const RED = "\x1b[31m";
const RESET = "\x1b[0m";

try {
  await runGetdesignCli();
} catch (error) {
  const message =
    error instanceof GetDesignError
      ? error.payload.code === "capture_failed"
        ? `Visual capture failed: ${error.message}`
        : error.message
      : error instanceof Error
        ? error.message
        : String(error);
  console.error(`${RED}getdesign: ${message}${RESET}`);
  process.exit(1);
}
