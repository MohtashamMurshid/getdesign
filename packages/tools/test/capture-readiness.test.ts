import { expect, test } from "bun:test";

import { runCapture } from "../src/daytona/capture";
import { content, inspectFixture, intro, loader } from "./fixtures/readiness-pages";
import { captureSandbox, mockSandboxCreation } from "./fixtures/capture-sandbox";

const options = { url: "https://example.com", daytonaApiKey: "test-key-not-a-secret", readinessTimeoutMs: 2500 };

for (const [name, frames, clicks] of [
  ["disappearing loader", [loader, content, content], 0],
  ["benign intro", [intro, intro, content, content], 1],
] as const) {
  test(`capture reaches all landing-page tiles after ${name} and disposes the sandbox`, async () => {
    const fake = captureSandbox(frames.map((html) => inspectFixture(html)));
    const sdk = mockSandboxCreation([fake.sandbox]);
    try {
      const result = await runCapture(options);
      expect(result.documentHeight).toBe(1800);
      expect(result.tiles.map((tile) => tile.yOffset)).toEqual([0, 768, 1536]);
      expect(fake.state.clicks).toHaveLength(clicks);
      expect(fake.state.screenshots).toBe(3);
      expect(fake.state.keys).toEqual(["Home", "Page_Down", "Page_Down"]);
      expect(fake.state.deleted).toBe(1);
    } finally { sdk.restore(); }
  });
}

test("readiness timeout disposes the sandbox without measurement or screenshots, even in visual mode", async () => {
  const fake = captureSandbox([inspectFixture(loader)]);
  const sdk = mockSandboxCreation([fake.sandbox]);
  try {
    await expect(runCapture({ ...options, readinessTimeoutMs: 40, measurementMode: "visual" }))
      .rejects.toMatchObject({ code: "capture_not_ready", reason: "loader_visible" });
    expect(fake.state.commands.some((cmd) => cmd.includes("getdesign-cdp-probe.py"))).toBe(false);
    expect(fake.state.keys).toEqual([]);
    expect(fake.state.screenshots).toBe(0);
    expect(fake.state.deleted).toBe(1);
  } finally { sdk.restore(); }
});

test("prepare failures still dispose the created sandbox and preserve the original error", async () => {
  const error = new Error("Computer Use start failed");
  const fake = captureSandbox([inspectFixture(content)], { prepare: error });
  const sdk = mockSandboxCreation([fake.sandbox]);
  try {
    await expect(runCapture(options)).rejects.toBe(error);
    expect(fake.state.deleted).toBe(1);
    expect(fake.state.probes).toBe(0);
  } finally { sdk.restore(); }
});

test("a late gate after measurement stops tiling without a second dismissal attempt", async () => {
  const fake = captureSandbox([content, content, intro].map((html) => inspectFixture(html)));
  const sdk = mockSandboxCreation([fake.sandbox]);
  try {
    await expect(runCapture(options)).rejects.toMatchObject({ code: "capture_not_ready", reason: "benign_intro" });
    expect(fake.state.clicks).toEqual([]);
    expect(fake.state.screenshots).toBe(0);
    expect(fake.state.deleted).toBe(1);
  } finally { sdk.restore(); }
});

test("cleanup errors do not hide screenshot failures", async () => {
  const error = new Error("Screenshot failed");
  const fake = captureSandbox([inspectFixture(content)], { screenshot: error, cleanup: new Error("Delete failed") });
  const sdk = mockSandboxCreation([fake.sandbox]);
  try {
    await expect(runCapture(options)).rejects.toBe(error);
    expect(fake.state.deleted).toBe(1);
  } finally { sdk.restore(); }
});

test("creation errors propagate without trying to dispose an uncreated sandbox", async () => {
  const sdk = mockSandboxCreation([]);
  try {
    await expect(runCapture(options)).rejects.toThrow("Unexpected sandbox creation");
    expect(sdk.created).toEqual([]);
  } finally { sdk.restore(); }
});

test("height measurement can still fall back to Computer Use after content readiness succeeds", async () => {
  const fake = captureSandbox([inspectFixture(content)], { heightMeasurement: true });
  const sdk = mockSandboxCreation([fake.sandbox]);
  try {
    const result = await runCapture(options);
    expect(result.measurementMode).toBe("visual");
    expect(result.tiles).toHaveLength(2);
    expect(fake.state.clicks).toEqual([]);
    expect(fake.state.deleted).toBe(1);
  } finally { sdk.restore(); }
});
