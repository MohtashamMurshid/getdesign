// @ts-nocheck — dashboard tsc has no bun:test types
import { expect, test } from "bun:test";

import { isCaptureFailure } from "./is-capture-failure";

test("detects capture_failed code", () => {
  expect(
    isCaptureFailure({ code: "capture_failed", message: "something else" }),
  ).toBe(true);
  expect(isCaptureFailure({ name: "capture_failed" })).toBe(true);
});

test("detects capture or Daytona wording", () => {
  expect(isCaptureFailure("Visual capture failed.")).toBe(true);
  expect(
    isCaptureFailure("No Daytona API key available; set DAYTONA_API_KEY."),
  ).toBe(true);
  expect(
    isCaptureFailure({ message: "Capture skipped", reason: "browser never ready" }),
  ).toBe(true);
  expect(isCaptureFailure({ reason: "Daytona sandbox timed out" })).toBe(true);
});

test("ignores unrelated errors", () => {
  expect(isCaptureFailure(null)).toBe(false);
  expect(isCaptureFailure(undefined)).toBe(false);
  expect(isCaptureFailure("Token artifact missing.")).toBe(false);
  expect(isCaptureFailure({ code: "extract_failed", message: "bad tokens" })).toBe(
    false,
  );
});
