import { describe, expect, test } from "bun:test";

import { parseArgs } from "./lib/parseArgs";
import { defaultOutputPath, normalizeUrl, resolveOutputPath, slugify } from "./lib/outputPath";

describe("parseArgs", () => {
  test("positional url", () => {
    const o = parseArgs(["https://example.com"]);
    expect(o.url).toBe("https://example.com");
  });

  test("--url and flags", () => {
    const o = parseArgs(["--url", "linear.app", "--out", "out.md"]);
    expect(o.url).toBe("linear.app");
    expect(o.out).toBe("out.md");
  });

  test("rejects unknown option", () => {
    expect(() => parseArgs(["--nope"])).toThrow("Unknown option");
  });
});

describe("outputPath", () => {
  test("normalizeUrl adds scheme", () => {
    expect(normalizeUrl("linear.app")).toBe("https://linear.app");
  });

  test("slugify", () => {
    expect(slugify("Linear App")).toBe("linear-app");
  });

  test("defaultOutputPath uses hostname slug", () => {
    const p = defaultOutputPath("/proj", "https://www.Linear.app/foo");
    expect(p).toContain("getdesign-runs");
    expect(p).toContain("linear-app");
    expect(p.endsWith("design.md")).toBe(true);
  });

  test("resolveOutputPath explicit file", () => {
    expect(resolveOutputPath("/proj", "design.md", "https://a.com")).toBe("/proj/design.md");
  });
});
