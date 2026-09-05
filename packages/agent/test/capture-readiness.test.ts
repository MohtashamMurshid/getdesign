import { expect, test } from "bun:test";
import { MockLanguageModelV3 } from "ai/test";

import { runVisual } from "../src/agents/visual";
import { runDesign } from "../src/runDesign";
import { captureSandbox, mockSandboxCreation } from "../../tools/test/fixtures/capture-sandbox";
import { content, inspectFixture, protectedGate } from "../../tools/test/fixtures/readiness-pages";
import { SAMPLE_HTML } from "./fixtures";

test("readiness failures retry three times in fresh sandboxes and can recover", async () => {
  const blocked = inspectFixture(protectedGate("Verify you are human"));
  const fakes = [captureSandbox([blocked]), captureSandbox([blocked]), captureSandbox([inspectFixture(content)])];
  const sdk = mockSandboxCreation(fakes.map((fake) => fake.sandbox));
  const warnings: string[] = [];
  try {
    const result = await runVisual({ url: "https://example.com" }, {
      daytonaApiKey: "test-key-not-a-secret",
      onCapturePhase: (event) => { if (event.phase === "attempt") warnings.push(event.detail!); },
    });
    expect(result.status).toBe("captured");
    if (result.status === "captured") expect(result.tiles).toHaveLength(3);
    expect(sdk.created).toHaveLength(3);
    expect(new Set(sdk.created).size).toBe(3);
    expect(fakes.map((fake) => fake.state.deleted)).toEqual([1, 1, 1]);
    expect(fakes.map((fake) => fake.state.screenshots)).toEqual([0, 0, 3]);
    expect(warnings).toHaveLength(2);
    expect(warnings[1]).toContain("attempt 2/3 failed");
  } finally { sdk.restore(); }
});

test("final readiness failure propagates capture_failed and never synthesizes a gate design", async () => {
  const blocked = inspectFixture(protectedGate("Confirm your age"));
  const fakes = Array.from({ length: 3 }, () => captureSandbox([blocked]));
  const sdk = mockSandboxCreation(fakes.map((fake) => fake.sandbox));
  const originalFetch = globalThis.fetch;
  const phases: string[] = [];
  let modelCalls = 0;
  const model = new MockLanguageModelV3({ doGenerate: async () => {
    modelCalls += 1;
    throw new Error("LLM must not run on a failed capture");
  } });
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === "https://example.com" || url === "https://example.com/") return new Response(SAMPLE_HTML);
    if (url === "https://example.com/style.css") return new Response("body {color: black}");
    throw new Error(`Unexpected network call: ${url}`);
  }) as typeof fetch;
  try {
    await expect(runDesign("https://example.com", {
      model, credentials: { daytonaApiKey: "test-key-not-a-secret" },
      onPhase: (event) => { phases.push(event.phase); },
    })).rejects.toMatchObject({
      code: "capture_failed",
      visual: { status: "failed", attempts: 3, reason: expect.stringContaining("protected_gate") },
    });
    expect(sdk.created).toHaveLength(3);
    expect(fakes.map((fake) => fake.state.deleted)).toEqual([1, 1, 1]);
    expect(fakes.every((fake) => fake.state.screenshots === 0 && fake.state.clicks.length === 0)).toBe(true);
    expect(modelCalls).toBe(0);
    expect(phases).not.toContain("describe");
    expect(phases).not.toContain("synthesize");
    expect(phases).not.toContain("render");
  } finally {
    sdk.restore();
    globalThis.fetch = originalFetch;
  }
});
