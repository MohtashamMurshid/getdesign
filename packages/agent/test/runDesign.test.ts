import { afterEach, beforeEach, expect, test } from "bun:test";
import { MockLanguageModelV3 } from "ai/test";

import { runDesign } from "../src/runDesign";
import { runSynthesize, MAX_SYNTHESIS_TILES } from "../src/agents/synthesizer";
import { runExtractTokens } from "../src/agents/tokenExtractor";
import { runCrawl } from "../src/agents/crawler";
import { SAMPLE_CSS, SAMPLE_DESIGN_DOC, SAMPLE_HTML } from "./fixtures";
import type { ScreenshotArtifact } from "@getdesign/tools/daytona";

const originalFetch = globalThis.fetch;

const SAMPLE_DESCRIPTION = `## Overall composition & rhythm
A single hero band stacked above a modest content well; vertical rhythm is generous.

## Section-by-section walkthrough
- **(tile 1)** Hero with a tight headline and subdued background.

## Navigation & header
A minimal top bar; no global nav.

## Hero / first impression
A short heading reading "Acme" sets the tone.

## Imagery, iconography, illustration
No raster imagery; pure typographic composition.

## Typography in context
A single sans-serif voice handles both display and body roles.

## Color usage in context
Near-black surface, near-white text, single saturated accent reserved for the call to action.

## Microcopy & messaging
Terse: a single product name appears.

## Visible interaction affordances
None visible beyond the headline.

## Footer & end-of-page
The page ends quietly with no formal footer band.

## Notable details
The composition is unusually sparse for a marketing landing page.
`;

function installStubFetch(): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.endsWith("/style.css")) {
      return new Response(SAMPLE_CSS, {
        status: 200,
        headers: { "content-type": "text/css" },
      });
    }

    if (url.startsWith("https://example.com")) {
      return new Response(SAMPLE_HTML, {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }

    throw new Error(`Unexpected fetch in test: ${url}`);
  }) as typeof fetch;
}

function makeMockModel() {
  return new MockLanguageModelV3({
    doGenerate: async (options) => {
      // Synthesizer asks for structured JSON output via Output.object;
      // describe is plain text. Branch on responseFormat.
      const isStructured = options.responseFormat?.type === "json";
      const text = isStructured
        ? JSON.stringify(SAMPLE_DESIGN_DOC)
        : SAMPLE_DESCRIPTION;
      return {
        content: [{ type: "text", text }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: {
            total: 100,
            noCache: 100,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: {
            total: 500,
            text: 500,
            reasoning: undefined,
          },
        },
        warnings: [],
      };
    },
  });
}

beforeEach(() => {
  installStubFetch();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("runDesign end-to-end with stubbed fetch and mocked LLM (text-only)", async () => {
  const mockModel = makeMockModel();
  const completedPhases: string[] = [];

  const result = await runDesign("https://example.com", {
    model: mockModel,
    visualRequirement: "skip_silently",
    onPhase: (event) => {
      if ("status" in event && event.status === "ok") {
        completedPhases.push(event.phase);
      }
    },
  });

  // No describe phase when capture is skipped.
  expect(completedPhases).toEqual(["crawl", "visual", "extract", "synthesize", "render"]);
  expect(result.visual.status).toBe("skipped");
  expect(result.visualDescription).toBeNull();
  expect(result.tiles).toBe(0);
  expect(result.doc.siteName).toBe("Acme");
  expect(result.tokens.typography.fontFamilies.length).toBeGreaterThan(0);
  expect(result.markdown).toContain("# Acme Design System");
  expect(result.markdown).toContain("## 1. Visual Theme & Atmosphere");
});

test("synthesizer caps tiles at MAX_SYNTHESIS_TILES and notes the omission", async () => {
  const calls: { tileImageCount: number; userText: string }[] = [];
  const mockModel = new MockLanguageModelV3({
    doGenerate: async (options) => {
      const userMsg = options.prompt.find((p) => p.role === "user");
      let tileImageCount = 0;
      let userText = "";
      if (userMsg && Array.isArray(userMsg.content)) {
        for (const part of userMsg.content) {
          if (part.type === "file") tileImageCount += 1;
          if (part.type === "text") userText += part.text;
        }
      }
      calls.push({ tileImageCount, userText });
      return {
        content: [{ type: "text", text: JSON.stringify(SAMPLE_DESIGN_DOC) }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 1, text: 1, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });

  const crawl = await runCrawl({ url: "https://example.com" });
  const tokens = runExtractTokens(crawl);

  const oversize: ScreenshotArtifact[] = Array.from({ length: 15 }, () => ({
    imageBase64:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    width: 1024,
    height: 768,
    format: "png",
  }));

  await runSynthesize({
    sourceUrl: "https://example.com",
    siteName: "Acme",
    tokens,
    tiles: oversize,
    visualDescription: "short description",
    model: mockModel,
  });

  expect(calls.length).toBe(1);
  expect(calls[0]!.tileImageCount).toBe(MAX_SYNTHESIS_TILES);
  expect(calls[0]!.userText).toContain(`tiles ${MAX_SYNTHESIS_TILES + 1}..15 omitted`);
});
