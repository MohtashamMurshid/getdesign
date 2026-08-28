import { expect, test } from "bun:test";

import { RunDesignError, type RunDesignResult } from "@getdesign/agent";

import { createApp } from "../src/app";
import type { RunDesignFn } from "../src/handlers/getDesign";

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

const AUTH = { Authorization: "Bearer test-token" } as const;
const BYOK = {
  "x-daytona-api-key": "dtn_test",
  "x-openai-api-key": "sk_test",
} as const;

function authedApp(runDesign: RunDesignFn) {
  return createApp({
    runDesign,
    verifyAccessToken: async () => ({ userId: "user_test" }),
  });
}

function request(path: string, headers?: Record<string, string>) {
  return new Request(`http://localhost${path}`, { headers });
}

test("GET /health is unauthenticated", async () => {
  const app = createApp({
    runDesign: async () => {
      throw new Error("should not run");
    },
  });

  const res = await app.fetch(request("/health"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("GET / without Authorization returns 401 and does not run", async () => {
  let called = false;
  const app = authedApp(async () => {
    called = true;
    return stubResult("# hi");
  });

  const res = await app.fetch(request("/?url=https://example.com"));
  expect(res.status).toBe(401);
  expect(res.headers.get("www-authenticate")).toBe("Bearer");
  const body = (await res.json()) as { error: string };
  expect(body.error).toBe("unauthorized");
  expect(called).toBe(false);
});

test("GET / without injected verifier fails closed when WORKOS_CLIENT_ID is unset", async () => {
  const previous = process.env.WORKOS_CLIENT_ID;
  delete process.env.WORKOS_CLIENT_ID;
  let called = false;
  try {
    const app = createApp({
      runDesign: async () => {
        called = true;
        return stubResult("# hi");
      },
    });
    const res = await app.fetch(
      request("/?url=https://example.com", { ...AUTH, ...BYOK }),
    );
    expect(res.status).toBe(401);
    expect(called).toBe(false);
  } finally {
    if (previous === undefined) {
      delete process.env.WORKOS_CLIENT_ID;
    } else {
      process.env.WORKOS_CLIENT_ID = previous;
    }
  }
});

test("GET / when verifyAccessToken rejects returns 401", async () => {
  let called = false;
  const app = createApp({
    runDesign: async () => {
      called = true;
      return stubResult("# hi");
    },
    verifyAccessToken: async () => {
      throw new Error("invalid token");
    },
  });

  const res = await app.fetch(
    request("/?url=https://example.com", { ...AUTH, ...BYOK }),
  );
  expect(res.status).toBe(401);
  expect(res.headers.get("www-authenticate")).toBe("Bearer");
  const body = (await res.json()) as { error: string };
  expect(body.error).toBe("unauthorized");
  expect(called).toBe(false);
});

test("GET / with auth but missing BYOK headers returns 409 credentials_missing", async () => {
  let called = false;
  const app = authedApp(async () => {
    called = true;
    return stubResult("# hi");
  });

  const res = await app.fetch(request("/?url=https://example.com", { ...AUTH }));
  expect(res.status).toBe(409);
  const body = (await res.json()) as {
    error: string;
    code: string;
    reason: string;
  };
  expect(body.error).toBe("credentials_missing");
  expect(body.code).toBe("credentials_missing");
  expect(body.reason.length).toBeGreaterThan(0);
  expect(called).toBe(false);
});

test("GET /v1/design/stream without Authorization returns 401", async () => {
  let called = false;
  const app = authedApp(async () => {
    called = true;
    return stubResult("# hi");
  });

  const res = await app.fetch(
    request("/v1/design/stream?url=https://example.com"),
  );
  expect(res.status).toBe(401);
  expect((await res.json() as { error: string }).error).toBe("unauthorized");
  expect(called).toBe(false);
});

test("GET / text_only mode without Daytona but with OpenAI reaches runDesign", async () => {
  let called = false;
  const app = authedApp(async () => {
    called = true;
    return {
      ...stubResult("# text only"),
      mode: "text_only",
    } satisfies RunDesignResult;
  });

  const res = await app.fetch(
    request("/?url=https://example.com", {
      ...AUTH,
      "x-getdesign-mode": "text_only",
      "x-openai-api-key": "sk_test",
    }),
  );
  expect(res.status).toBe(200);
  expect(called).toBe(true);
});

test("GET / without url returns 400 JSON", async () => {
  const app = authedApp(async () => {
    throw new Error("should not run");
  });

  const res = await app.fetch(request("/", { ...AUTH }));
  expect(res.status).toBe(400);
  expect(res.headers.get("content-type") ?? "").toContain("application/json");
  const body = (await res.json()) as { error: string };
  expect(typeof body.error).toBe("string");
});

test("GET /?url=notaurl returns 400 JSON", async () => {
  const app = authedApp(async () => {
    throw new Error("should not run");
  });

  const res = await app.fetch(request("/?url=notaurl", { ...AUTH }));
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: string };
  expect(body.error.length).toBeGreaterThan(0);
});

test("GET /?url=https://example.com returns 200 markdown from stub", async () => {
  const markdown = "# hi";
  let calledWith: string | undefined;
  const app = authedApp(async (url) => {
    calledWith = url;
    return stubResult(markdown);
  });

  const res = await app.fetch(
    request("/?url=https://example.com", { ...AUTH, ...BYOK }),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(await res.text()).toBe(markdown);
  expect(calledWith).toBe("https://example.com");
});

test("GET /v1/design?format=json returns structured result", async () => {
  const app = authedApp(async () => stubResult("# hi"));

  const res = await app.fetch(
    request("/v1/design?url=https://example.com&format=json", {
      ...AUTH,
      ...BYOK,
    }),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  const body = (await res.json()) as { markdown: string; mode: string; tiles: number };
  expect(body.markdown).toBe("# hi");
  expect(body.mode).toBe("visual");
  expect(body.tiles).toBe(0);
});

test("GET /v1/design/stream returns progress and result events", async () => {
  const app = authedApp(async (_url, options) => {
    await options?.onPhase?.({ phase: "crawl", status: "start" });
    return stubResult("# streamed");
  });

  const res = await app.fetch(
    request("/v1/design/stream?url=https://example.com", {
      ...AUTH,
      ...BYOK,
    }),
  );
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toContain("event: progress");
  expect(text).toContain("\"phase\":\"crawl\"");
  expect(text).toContain("event: result");
  expect(text).toContain("\"markdown\":\"# streamed\"");
});

test("GET / returns 409 when capture fails", async () => {
  const app = authedApp(async () => {
    throw new RunDesignError({
      status: "failed",
      reason: "Chromium did not become ready",
      attempts: 3,
    });
  });

  const res = await app.fetch(
    request("/?url=https://example.com", { ...AUTH, ...BYOK }),
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
  const app = authedApp(async (url, options) => {
    received = { url, options };
    return {
      ...stubResult("# text only"),
      mode: "text_only",
    } satisfies RunDesignResult;
  });

  const res = await app.fetch(
    request("/?url=https://example.com", {
      ...AUTH,
      "x-getdesign-mode": "text_only",
      "x-daytona-api-key": "dtn_test",
      "x-openai-api-key": "sk_test",
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
  const app = authedApp(async () => {
    throw new Error("boom");
  });

  const originalError = console.error;
  console.error = () => {};
  try {
    const res = await app.fetch(
      request("/?url=https://example.com", { ...AUTH, ...BYOK }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("internal");
  } finally {
    console.error = originalError;
  }
});
