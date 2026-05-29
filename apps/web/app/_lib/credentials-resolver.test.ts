import { describe, expect, test } from "bun:test";

import { resolveCredentials } from "./credentials-resolver";

describe("resolveCredentials", () => {
  test("prefers request keys over vault and env", () => {
    const result = resolveCredentials({
      request: { daytonaApiKey: "dt_request", openaiApiKey: "sk_request" },
      vault: { daytonaApiKey: "dt_vault", openaiApiKey: "sk_vault" },
      env: { daytonaApiKey: "dt_env", openaiApiKey: "sk_env" },
    });

    expect(result.credentials).toEqual({
      daytonaApiKey: "dt_request",
      openaiApiKey: "sk_request",
    });
    expect(result.origin).toEqual({
      daytonaApiKey: "request",
      openaiApiKey: "request",
    });
    expect(result.missing).toEqual([]);
  });

  test("falls back to vault when request keys are absent", () => {
    const result = resolveCredentials({
      vault: { daytonaApiKey: "dt_vault", openaiApiKey: "sk_vault" },
      env: { daytonaApiKey: "dt_env", openaiApiKey: "sk_env" },
    });

    expect(result.credentials).toEqual({
      daytonaApiKey: "dt_vault",
      openaiApiKey: "sk_vault",
    });
    expect(result.origin.daytonaApiKey).toBe("vault");
    expect(result.origin.openaiApiKey).toBe("vault");
  });

  test("falls back to env as the last resort (local dev)", () => {
    const result = resolveCredentials({
      env: { daytonaApiKey: "dt_env", openaiApiKey: "sk_env" },
    });

    expect(result.credentials).toEqual({
      daytonaApiKey: "dt_env",
      openaiApiKey: "sk_env",
    });
    expect(result.origin.daytonaApiKey).toBe("env");
    expect(result.missing).toEqual([]);
  });

  test("resolves each key independently across sources", () => {
    const result = resolveCredentials({
      request: { daytonaApiKey: "dt_request" },
      vault: { openaiApiKey: "sk_vault" },
      env: { openaiApiKey: "sk_env" },
    });

    expect(result.credentials).toEqual({
      daytonaApiKey: "dt_request",
      openaiApiKey: "sk_vault",
    });
    expect(result.origin.daytonaApiKey).toBe("request");
    expect(result.origin.openaiApiKey).toBe("vault");
  });

  test("treats blank / whitespace values as absent", () => {
    const result = resolveCredentials({
      request: { daytonaApiKey: "   ", openaiApiKey: "" },
      vault: { daytonaApiKey: "dt_vault" },
    });

    expect(result.credentials.daytonaApiKey).toBe("dt_vault");
    expect(result.credentials.openaiApiKey).toBeUndefined();
    expect(result.missing).toEqual(["openaiApiKey"]);
  });

  test("reports all missing keys when nothing resolves", () => {
    const result = resolveCredentials({});
    expect(result.credentials).toEqual({});
    expect(result.missing).toEqual(["daytonaApiKey", "openaiApiKey"]);
  });
});
