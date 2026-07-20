import { describe, expect, test } from "bun:test";

import {
  DEMO_SITES,
  DOCS_BASE_URL,
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
    expect(buildCurlExample("stripe.com")).toContain("api.getdesign.app");
    expect(buildCliCommand("cursor.com")).toContain("bunx @getdesign/cli");
    expect(buildSdkInstall()).toBe("bun add @getdesign/sdk");
  });

  test("chromeLabel substitutes url for api", () => {
    expect(chromeLabel("api", "linear.app")).toBe(
      "api.getdesign.app/?url=linear.app",
    );
  });
});
