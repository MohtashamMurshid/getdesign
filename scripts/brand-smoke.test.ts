import { describe, expect, test } from "bun:test";

import {
  BRANDS,
  formatResultTable,
  medianMs,
  parseBrandSmokeArgs,
  type BrandResult,
} from "./brand-smoke/cli.ts";
import {
  canonicalColorKey,
  checkPaletteGrounding,
  collectCssColorKeys,
  joinStylesheetCss,
} from "./brand-smoke/grounding.ts";
import {
  createHumanReviewTemplate,
  evaluateHumanReview,
} from "./brand-smoke/review.ts";

const FIXTURE_CSS = `
  :root {
    --bg: #fff;
    --ink: #0a0a0a;
    --accent: #5E6AD2;
  }
  .hero {
    color: rgb(10, 10, 10);
    background: #FFFFFF;
  }
  .chip {
    background: rgb(255, 255, 255);
    border-color: rgb(94 106 210);
  }
`;

const FIXTURE_PALETTE = {
  groups: [
    {
      heading: "Primary",
      entries: [{ hex: "#FFFFFF" }, { hex: "#0A0A0A" }, { hex: "#5e6ad2" }],
    },
  ],
};

describe("canonicalColorKey", () => {
  test("treats #fff, #ffffff, and rgb(255,255,255) as the same color", () => {
    expect(canonicalColorKey("#fff")).toBe("ffffff");
    expect(canonicalColorKey("#ffffff")).toBe("ffffff");
    expect(canonicalColorKey("#FFFFFF")).toBe("ffffff");
    expect(canonicalColorKey("rgb(255, 255, 255)")).toBe("ffffff");
    expect(canonicalColorKey("rgb(255,255,255)")).toBe("ffffff");
  });
});

describe("checkPaletteGrounding", () => {
  test("passes when every palette hex is present in fixture CSS", () => {
    const result = checkPaletteGrounding(FIXTURE_CSS, FIXTURE_PALETTE);
    expect(result.pass).toBe(true);
    expect(result.misses).toEqual([]);
  });

  test("short hex in CSS grounds a long palette hex", () => {
    const result = checkPaletteGrounding(".x { color: #fff }", {
      groups: [{ entries: [{ hex: "#ffffff" }] }],
    });
    expect(result.pass).toBe(true);
  });

  test("long hex in CSS grounds a short palette hex", () => {
    const result = checkPaletteGrounding(".x { color: #ffffff }", {
      groups: [{ entries: [{ hex: "#fff" }] }],
    });
    expect(result.pass).toBe(true);
  });

  test("rgb() in CSS grounds an equivalent palette hex", () => {
    const result = checkPaletteGrounding(
      ".x { color: rgb(255, 255, 255); accent: rgb(94, 106, 210) }",
      {
        groups: [{ entries: [{ hex: "#fff" }, { hex: "#5E6AD2" }] }],
      },
    );
    expect(result.pass).toBe(true);
  });

  test("space-separated rgb() matches hex", () => {
    const result = checkPaletteGrounding(".x { color: rgb(10 10 10) }", {
      groups: [{ entries: [{ hex: "#0a0a0a" }] }],
    });
    expect(result.pass).toBe(true);
  });

  test("fails with the original palette hex when CSS has no match", () => {
    const result = checkPaletteGrounding(".x { color: #111111 }", {
      groups: [{ entries: [{ hex: "#ff0000" }] }],
    });
    expect(result.pass).toBe(false);
    expect(result.misses).toEqual(["#ff0000"]);
  });

  test("reports only the missing entries from a mixed palette", () => {
    const result = checkPaletteGrounding(FIXTURE_CSS, {
      groups: [
        {
          entries: [{ hex: "#fff" }, { hex: "#c0ffee" }, { hex: "#0a0a0a" }],
        },
      ],
    });
    expect(result.pass).toBe(false);
    expect(result.misses).toEqual(["#c0ffee"]);
  });

  test("empty palette passes", () => {
    expect(checkPaletteGrounding(FIXTURE_CSS, { groups: [] })).toEqual({
      pass: true,
      misses: [],
    });
  });

  test("joins crawled stylesheet contents before checking", () => {
    const css = joinStylesheetCss([
      { content: ".a { color: #abc; }" },
      { content: ".b { background: rgb(170, 187, 204); }" },
    ]);
    const keys = collectCssColorKeys(css);
    expect(keys.has("aabbcc")).toBe(true);
    expect(
      checkPaletteGrounding(css, {
        groups: [{ entries: [{ hex: "#AABBCC" }] }],
      }).pass,
    ).toBe(true);
  });
});

describe("brand-smoke CLI helpers", () => {
  test("brand list is 20 unique https marketing URLs", () => {
    expect(BRANDS).toHaveLength(20);
    const urls = BRANDS.map((brand) => brand.url);
    expect(new Set(urls).size).toBe(20);
    for (const brand of BRANDS) {
      expect(brand.url.startsWith("https://")).toBe(true);
    }
  });

  test("parseBrandSmokeArgs reads --limit --text-only --out", () => {
    expect(
      parseBrandSmokeArgs([
        "--limit",
        "2",
        "--text-only",
        "--out",
        "/tmp/smoke",
      ]),
    ).toEqual({
      limit: 2,
      textOnly: true,
      out: "/tmp/smoke",
      help: false,
    });
  });

  test("medianMs is P50 and does not treat the 90s budget as a failure", () => {
    expect(medianMs([10_000, 95_000, 20_000])).toBe(20_000);
    expect(medianMs([10_000, 20_000, 90_001, 100_000])).toBe(55_001);
    expect(medianMs([])).toBeNull();
  });

  test("formatResultTable prints brand status duration grounding mode", () => {
    const rows: BrandResult[] = [
      {
        brand: "cursor",
        url: "https://cursor.com",
        status: "ok",
        durationMs: 42_100,
        mode: "text_only",
        tileCount: 0,
        groundingPass: true,
        groundingMisses: [],
      },
      {
        brand: "linear",
        url: "https://linear.app",
        status: "fail",
        error: "palette hex missing from crawled CSS: #c0ffee",
        durationMs: 12_000,
        mode: "visual",
        tileCount: 3,
        groundingPass: false,
        groundingMisses: ["#c0ffee"],
      },
    ];

    const table = formatResultTable(rows);
    expect(table).toContain("brand");
    expect(table).toContain("cursor");
    expect(table).toContain("ok");
    expect(table).toContain("42.1s");
    expect(table).toContain("pass");
    expect(table).toContain("fail(1)");
    expect(table).toContain("text_only");
  });
});

describe("M3 human review gate", () => {
  const results = Array.from({ length: 20 }, (_, index) => ({
    brand: `brand-${index + 1}`,
    url: `https://brand-${index + 1}.example`,
  }));

  test("requires ratings for 20 unique brands", () => {
    const review = createHumanReviewTemplate(results);
    expect(evaluateHumanReview(review)).toMatchObject({
      total: 20,
      pending: 20,
      complete: false,
      pass: false,
    });
  });

  test("passes 18 correct ratings and fails 17", () => {
    const review = createHumanReviewTemplate(results);
    review.ratings.forEach((rating, index) => {
      rating.primaryColorsCorrect = index < 18;
    });
    expect(evaluateHumanReview(review)).toMatchObject({
      correct: 18,
      incorrect: 2,
      complete: true,
      pass: true,
    });

    review.ratings[17]!.primaryColorsCorrect = false;
    expect(evaluateHumanReview(review)).toMatchObject({
      correct: 17,
      complete: true,
      pass: false,
    });
  });
});
