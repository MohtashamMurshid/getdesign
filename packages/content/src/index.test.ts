import { describe, expect, test } from "bun:test";

import {
  DEMO_SITES,
  DOCS_BASE_URL,
  buildApiRequest,
  buildCliCommand,
  buildCurlExample,
  buildSdkInstall,
  chromeLabel,
  docsUrl,
} from "./index";

describe("@getdesign/content", () => {
  test("DEMO_SITES has the three marketing brands", () => {
    expect(DEMO_SITES.map((site) => site.id)).toEqual([
      "cursor",
      "linear",
      "stripe",
    ]);
  });

  test("docsUrl joins paths", () => {
    expect(docsUrl()).toBe(DOCS_BASE_URL);
    expect(docsUrl("/surfaces/api")).toBe(`${DOCS_BASE_URL}/surfaces/api`);
  });

  test("snippet builders", () => {
    const curl = buildCurlExample("stripe.com");
    expect(curl).toContain("api.getdesign.app");
    expect(curl).toContain("Authorization: Bearer $WORKOS_ACCESS_TOKEN");
    expect(curl).toContain("x-daytona-api-key: $DAYTONA_API_KEY");
    expect(curl).toContain("x-openai-api-key: $OPENAI_API_KEY");
    const request = buildApiRequest("stripe.com");
    expect(request).toContain("Authorization: Bearer $WORKOS_ACCESS_TOKEN");
    expect(request).toContain("x-daytona-api-key: $DAYTONA_API_KEY");
    expect(request).toContain("x-openai-api-key: $OPENAI_API_KEY");
    expect(buildCliCommand("cursor.com")).toContain("bunx @getdesign/cli");
    expect(buildSdkInstall()).toBe("bun add @getdesign/sdk");
  });

  test("chromeLabel substitutes url for api", () => {
    expect(chromeLabel("api", "linear.app")).toBe(
      "api.getdesign.app/?url=linear.app",
    );
  });
});
