import { describe, expect, test } from "bun:test";

import {
  workosAccessTokenIdentity,
  workosAccessTokenIssuers,
} from "../src/auth";

const CLIENT_ID = "client_test";

describe("WorkOS access-token claims", () => {
  test("accepts the current AuthKit User Management issuer", () => {
    expect(workosAccessTokenIssuers(CLIENT_ID)).toContain(
      "https://api.workos.com/user_management/client_test",
    );
  });

  test("accepts only tokens issued for this application", () => {
    expect(
      workosAccessTokenIdentity(
        { sub: "user_test", client_id: CLIENT_ID },
        CLIENT_ID,
      ),
    ).toEqual({ userId: "user_test" });

    expect(() =>
      workosAccessTokenIdentity(
        { sub: "user_test", client_id: "client_other" },
        CLIENT_ID,
      ),
    ).toThrow("client_id does not match");
  });

  test("rejects a token without a user", () => {
    expect(() =>
      workosAccessTokenIdentity({ client_id: CLIENT_ID }, CLIENT_ID),
    ).toThrow("missing sub");
  });
});
