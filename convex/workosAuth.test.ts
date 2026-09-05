import { describe, expect, test } from "bun:test";

import { requireWorkOsUserId, workosAuthProviders } from "./workosAuth";

function authContext(identity: { subject: string } | null) {
  return {
    auth: {
      async getUserIdentity() {
        return identity;
      },
    },
  };
}

describe("requireWorkOsUserId", () => {
  test("returns the subject from an authenticated token", async () => {
    await expect(
      requireWorkOsUserId(authContext({ subject: "user_123" }), "client_123"),
    ).resolves.toBe("user_123");
  });

  test("rejects unauthenticated callers", async () => {
    await expect(
      requireWorkOsUserId(authContext(null), "client_123"),
    ).rejects.toThrow("Unauthorized");
  });

  test("fails closed when the WorkOS client id is missing", async () => {
    await expect(
      requireWorkOsUserId(authContext({ subject: "user_123" }), ""),
    ).rejects.toThrow("WORKOS_CLIENT_ID is unset");
  });
});

describe("workosAuthProviders", () => {
  test("accepts every WorkOS access-token issuer variant", () => {
    expect(
      workosAuthProviders("client_123").map((provider) =>
        "issuer" in provider ? provider.issuer : provider.domain,
      ),
    ).toEqual([
      "https://api.workos.com/",
      "https://api.workos.com",
      "https://api.workos.com/user_management/client_123",
    ]);
  });
});
