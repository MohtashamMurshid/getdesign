import { describe, expect, test } from "bun:test";

import { GetDesignError, getDesign, streamDesign, type FetchAdapter } from ".";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

describe("getDesign", () => {
  test("requests the versioned JSON endpoint with BYOK headers", async () => {
    let request: Request | undefined;
    const fetchImpl: FetchAdapter = async (input, init) => {
      request = new Request(input, init);
      return jsonResponse({
        url: "https://example.com",
        markdown: "# hi",
        doc: {},
        tokens: {},
        visualDescription: null,
        tiles: 0,
        mode: "visual",
      });
    };

    const result = await getDesign("https://example.com", {
      apiUrl: "http://localhost:3001",
      siteName: "Example",
      credentials: {
        daytonaApiKey: "dtn_test",
        openaiApiKey: "sk_test",
      },
      fetch: fetchImpl,
    });

    expect(result.markdown).toBe("# hi");
    expect(request?.url).toBe(
      "http://localhost:3001/v1/design?url=https%3A%2F%2Fexample.com&siteName=Example&format=json",
    );
    expect(request?.headers.get("x-daytona-api-key")).toBe("dtn_test");
    expect(request?.headers.get("x-openai-api-key")).toBe("sk_test");
    expect(request?.headers.get("x-getdesign-site-name")).toBe("Example");
  });

  test("throws GetDesignError for non-ok JSON responses", async () => {
    await expect(
      getDesign("https://example.com", {
        fetch: async () => jsonResponse({ error: "capture_failed", reason: "no browser" }, { status: 409 }),
      }),
    ).rejects.toBeInstanceOf(GetDesignError);
  });
});

describe("streamDesign", () => {
  test("parses progress and result SSE events", async () => {
    const body = [
      'event: progress\ndata: {"phase":"crawl","status":"start"}',
      'event: result\ndata: {"url":"https://example.com","markdown":"# hi","doc":{},"tokens":{},"visualDescription":null,"tiles":0,"mode":"visual"}',
      "",
    ].join("\n\n");

    const events = [];
    for await (const event of streamDesign("https://example.com", {
      fetch: async () => new Response(body, { status: 200 }),
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: "progress", event: { phase: "crawl", status: "start" } });
    expect(events[1]?.type).toBe("result");
  });
});
