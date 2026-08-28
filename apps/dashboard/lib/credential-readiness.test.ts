import { describe, expect, test } from "bun:test";

import { hasRequiredRunCredentials } from "./credential-readiness";

describe("hasRequiredRunCredentials", () => {
  test("requires both Daytona and OpenAI", () => {
    expect(hasRequiredRunCredentials([])).toBe(false);
    expect(hasRequiredRunCredentials([{ provider: "openai" }])).toBe(false);
    expect(hasRequiredRunCredentials([{ provider: "daytona" }])).toBe(false);
    expect(
      hasRequiredRunCredentials([
        { provider: "daytona" },
        { provider: "openai" },
      ]),
    ).toBe(true);
  });
});
