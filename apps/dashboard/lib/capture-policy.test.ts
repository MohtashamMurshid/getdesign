import { describe, expect, test } from "bun:test";

import { captureFailureMessage } from "./capture-policy";

describe("captureFailureMessage", () => {
  test("accepts only a captured result", () => {
    expect(captureFailureMessage({ status: "captured" })).toBeNull();
    expect(
      captureFailureMessage({
        status: "skipped",
        reason: "browser unavailable",
      }),
    ).toBe("browser unavailable");
    expect(captureFailureMessage({ status: "failed" })).toBe(
      "Visual capture failed.",
    );
  });
});
