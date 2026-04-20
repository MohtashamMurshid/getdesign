import { afterEach, beforeEach, expect, test } from "bun:test";
import { MockLanguageModelV3 } from "ai/test";

import { runDesign } from "../src/runDesign";
import { SAMPLE_CSS, SAMPLE_DESIGN_DOC, SAMPLE_HTML } from "./fixtures";

const originalFetch = globalThis.fetch;

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

beforeEach(() => {
  installStubFetch();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("runDesign end-to-end with stubbed fetch and mocked LLM", async () => {
  const mockModel = new MockLanguageModelV3({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(SAMPLE_DESIGN_DOC) }],
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
    }),
  });

  const phases: string[] = [];

  const result = await runDesign("https://example.com", {
    model: mockModel,
    onPhase: (event) => {
      phases.push(event.phase);
    },
  });

  expect(phases).toEqual(["crawl", "visual", "extract", "synthesize", "render"]);
  expect(result.visual.status).toBe("skipped");
  expect(result.doc.siteName).toBe("Acme");
  expect(result.tokens.colors.length).toBeGreaterThan(0);
  expect(result.markdown).toContain("# Acme Design System");
  expect(result.markdown).toContain("## 1. Visual Theme & Atmosphere");
  expect(result.markdown).toContain("## 9. Agent Prompt Guide");
});
