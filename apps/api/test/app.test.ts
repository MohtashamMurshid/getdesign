import { expect, test } from "bun:test";

import { RunDesignError, type RunDesignResult } from "@getdesign/agent";

import { createApp } from "../src/app";

function stubResult(markdown: string): RunDesignResult {
  return {
    url: "https://example.com",
    markdown,
    doc: {} as RunDesignResult["doc"],
    tokens: {} as RunDesignResult["tokens"],
    crawl: {} as RunDesignResult["crawl"],
    visual: {} as RunDesignResult["visual"],
    visualDescription: null,
    tiles: 0,
    mode: "visual",
  };
}

test("GET / without url returns 400 JSON", async () => {
  const app = createApp({
    runDesign: async () => {
      throw new Error("should not run");
    },
  });

  const res = await app.fetch(new Request("http://localhost/"));
  expect(res.status).toBe(400);
  expect(res.headers.get("content-type") ?? "").toContain("application/json");
  const body = (await res.json()) as { error: string };
  expect(typeof body.error).toBe("string");
});

test("GET /?url=notaurl returns 400 JSON", async () => {
  const app = createApp({
    runDesign: async () => {
      throw new Error("should not run");
    },
  });

  const res = await app.fetch(
    new Request("http://localhost/?url=notaurl"),
  );
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: string };
  expect(body.error.length).toBeGreaterThan(0);
});

test("GET /?url=https://example.com returns 200 markdown from stub", async () => {
  const markdown = "# hi";
  let calledWith: string | undefined;
  const app = createApp({
    runDesign: async (url) => {
      calledWith = url;
      return stubResult(markdown);
    },
  });

  const res = await app.fetch(
    new Request("http://localhost/?url=https://example.com"),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(await res.text()).toBe(markdown);
  expect(calledWith).toBe("https://example.com");
});

test("GET /v1/design?format=json returns structured result", async () => {
  const app = createApp({
    runDesign: async () => stubResult("# hi"),
  });

  const res = await app.fetch(
    new Request("http://localhost/v1/design?url=https://example.com&format=json"),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  const body = (await res.json()) as { markdown: string; mode: string; tiles: number };
  expect(body.markdown).toBe("# hi");
  expect(body.mode).toBe("visual");
  expect(body.tiles).toBe(0);
});

test("GET /v1/design/stream returns progress and result events", async () => {
  const app = createApp({
    runDesign: async (_url, options) => {
      await options?.onPhase?.({ phase: "crawl", status: "start" });
      return stubResult("# streamed");
    },
  });

  const res = await app.fetch(
    new Request("http://localhost/v1/design/stream?url=https://example.com"),
  );
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toContain("event: progress");
  expect(text).toContain("\"phase\":\"crawl\"");
  expect(text).toContain("event: result");
  expect(text).toContain("\"markdown\":\"# streamed\"");
});

test("GET / returns 409 when capture fails", async () => {
  const app = createApp({
    runDesign: async () => {
      throw new RunDesignError({
        status: "failed",
        reason: "Chromium did not become ready",
        attempts: 3,
      });
    },
  });

  const res = await app.fetch(
    new Request("http://localhost/?url=https://example.com"),
  );
  expect(res.status).toBe(409);
  const body = (await res.json()) as {
    code: string;
    retryWith?: { header: string; value: string };
  };
  expect(body.code).toBe("capture_failed");
  expect(body.retryWith?.header).toBe("x-getdesign-mode");
});

test("GET / forwards x-getdesign-mode and credential headers to runDesign", async () => {
  let received: { url: string; options?: unknown } | undefined;
  const app = createApp({
    runDesign: async (url, options) => {
      received = { url, options };
      return {
        ...stubResult("# text only"),
        mode: "text_only",
      } satisfies RunDesignResult;
    },
  });

  const res = await app.fetch(
    new Request("http://localhost/?url=https://example.com", {
      headers: {
        "x-getdesign-mode": "text_only",
        "x-daytona-api-key": "dtn_test",
        "x-openai-api-key": "sk_test",
      },
    }),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("x-getdesign-mode")).toBe("text_only");
  const opts = (received?.options ?? {}) as {
    visualRequirement?: string;
    credentials?: { daytonaApiKey?: string; openaiApiKey?: string };
  };
  expect(opts.visualRequirement).toBe("text_only_fallback");
  expect(opts.credentials?.daytonaApiKey).toBe("dtn_test");
  expect(opts.credentials?.openaiApiKey).toBe("sk_test");
});

test("GET / returns 500 JSON when runDesign throws", async () => {
  const app = createApp({
    runDesign: async () => {
      throw new Error("boom");
    },
  });

  const originalError = console.error;
  console.error = () => {};
  try {
    const res = await app.fetch(
      new Request("http://localhost/?url=https://example.com"),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("internal");
  } finally {
    console.error = originalError;
  }
});
