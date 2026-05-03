import { describe, expect, test } from "bun:test";

import { GetDesignError, getDesign, streamDesign } from ".";
import type { GetDesignResult } from ".";

function stubResult(markdown = "# hi") {
  return {
    url: "https://example.com",
    markdown,
    doc: { palette: { groups: [] } },
    tokens: { typography: { fontFamilies: [] } },
    crawl: { siteName: "Example", stylesheets: [] },
    visual: { status: "skipped", reason: "test" },
    visualDescription: null,
    tiles: 0,
    mode: "text_only",
  } as const;
}

describe("getDesign", () => {
  test("runs the local agent pipeline with BYOK options", async () => {
    let received:
      | {
          url: string;
          options?: {
            siteName?: string;
            credentials?: { daytonaApiKey?: string; openaiApiKey?: string };
          };
        }
      | undefined;
    const result = await getDesign("https://example.com", {
      siteName: "Example",
      credentials: {
        daytonaApiKey: "dtn_test",
        openaiApiKey: "sk_test",
      },
      runDesign: async (url, options) => {
        received = { url, options };
        return stubResult();
      },
    });

    expect(result.markdown).toBe("# hi");
    expect(received?.url).toBe("https://example.com");
    expect(received?.options?.siteName).toBe("Example");
    expect(received?.options?.credentials?.daytonaApiKey).toBe("dtn_test");
    expect(received?.options?.credentials?.openaiApiKey).toBe("sk_test");
  });

  test("maps capture failures to GetDesignError", async () => {
    await expect(
      getDesign("https://example.com", {
        runDesign: async () => {
          throw new GetDesignError(409, { error: "capture_failed", reason: "no browser" });
        },
      }),
    ).rejects.toBeInstanceOf(GetDesignError);
  });
});

describe("streamDesign", () => {
  test("yields progress and result events from the local agent", async () => {
    const events = [];
    for await (const event of streamDesign("https://example.com", {
      runDesign: async (_url, options) => {
        await options?.onPhase?.({ phase: "crawl", status: "start" });
        return stubResult("# streamed");
      },
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: "progress", event: { phase: "crawl", status: "start" } });
    const result = events[1] as { type: "result"; result: GetDesignResult };
    expect(result.type).toBe("result");
    expect(result.result.markdown).toBe("# streamed");
  });
});
