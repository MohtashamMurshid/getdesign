import { afterEach, describe, expect, test } from "bun:test";

import { encryptCredential } from "./credential-crypto";
import {
  requireDaytonaCredential,
  requireOpenAiCredential,
  resolveRunCredentials,
} from "./run-credentials";

const MASTER_KEY = "ef".repeat(32);

afterEach(() => {
  delete process.env.GETDESIGN_CREDENTIALS_KEY;
  delete process.env.DAYTONA_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

describe("run credentials", () => {
  test("decrypts authenticated Convex rows and ignores process environment keys", async () => {
    process.env.GETDESIGN_CREDENTIALS_KEY = MASTER_KEY;
    process.env.DAYTONA_API_KEY = "environment-daytona";
    process.env.OPENAI_API_KEY = "environment-openai";
    const daytona = await encryptCredential("stored-daytona");
    const openai = await encryptCredential("stored-openai");
    const convex = {
      async query(_reference: unknown, args: { provider: string }) {
        const encrypted = args.provider === "daytona" ? daytona : openai;
        return {
          provider: args.provider,
          keySuffix: "test",
          ...encrypted,
        };
      },
    };

    const credentials = await resolveRunCredentials(convex as never);

    expect(credentials).toEqual({
      daytonaApiKey: "stored-daytona",
      openaiApiKey: "stored-openai",
    });
  });

  test("requires each stored provider key", () => {
    expect(() => requireDaytonaCredential({})).toThrow(/Daytona/);
    expect(() => requireOpenAiCredential({})).toThrow(/OpenAI/);
  });
});
