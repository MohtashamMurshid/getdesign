import { afterEach, describe, expect, test } from "bun:test";

import {
  decryptCredential,
  encryptCredential,
  keySuffix,
} from "./credential-crypto";

const HEX_KEY = "ab".repeat(32);
const BASE64_KEY = Buffer.alloc(32, 7).toString("base64");

afterEach(() => {
  delete process.env.GETDESIGN_CREDENTIALS_KEY;
});

describe("credential-crypto", () => {
  test("encrypt/decrypt roundtrip with a hex master key", async () => {
    process.env.GETDESIGN_CREDENTIALS_KEY = HEX_KEY;
    const plaintext = "sk-test-secret-key";
    const { ciphertext, iv } = await encryptCredential(plaintext);

    expect(ciphertext).not.toContain("sk-test");
    expect(ciphertext).not.toBe(plaintext);
    expect(await decryptCredential(ciphertext, iv)).toBe(plaintext);
  });

  test("encrypt/decrypt roundtrip with a base64 master key", async () => {
    process.env.GETDESIGN_CREDENTIALS_KEY = BASE64_KEY;
    const { ciphertext, iv } = await encryptCredential("dtn_abc123");
    expect(await decryptCredential(ciphertext, iv)).toBe("dtn_abc123");
  });

  test("same plaintext produces different ciphertext", async () => {
    process.env.GETDESIGN_CREDENTIALS_KEY = HEX_KEY;
    const first = await encryptCredential("sk-repeat");
    const second = await encryptCredential("sk-repeat");
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
  });

  test("keySuffix is the last four characters of the trimmed key", () => {
    expect(keySuffix("sk-abcdefgh")).toBe("efgh");
    expect(keySuffix("  dtn_wxyz  ")).toBe("wxyz");
  });

  test("keySuffix rejects keys shorter than four characters", () => {
    expect(() => keySuffix("abc")).toThrow(/too short/);
  });

  test("encrypt rejects a missing GETDESIGN_CREDENTIALS_KEY", async () => {
    await expect(encryptCredential("sk-test")).rejects.toThrow(
      /GETDESIGN_CREDENTIALS_KEY is not set/,
    );
  });

  test("encrypt rejects invalid master key material", async () => {
    process.env.GETDESIGN_CREDENTIALS_KEY = "too-short";
    await expect(encryptCredential("sk-test")).rejects.toThrow(/32 bytes/);
  });
});
