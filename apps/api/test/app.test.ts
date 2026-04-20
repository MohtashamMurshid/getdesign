import { expect, test } from "bun:test";

import type { RunDesignResult } from "@getdesign/agent";

import { createApp } from "../src/app";

function stubResult(markdown: string): RunDesignResult {
  return {
    url: "https://example.com",
    markdown,
    doc: {} as RunDesignResult["doc"],
    tokens: {} as RunDesignResult["tokens"],
    crawl: {} as RunDesignResult["crawl"],
    visual: {} as RunDesignResult["visual"],
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
