import { expect, test } from "bun:test";
import type { Sandbox } from "@daytonaio/sdk";

import { CaptureReadinessError, waitForCaptureReadiness } from "../src/daytona/readiness";
import type { ReadinessSnapshot } from "../src/daytona/readiness-inspection";
import { measurePageReadiness } from "../src/daytona/measurement";
import type { CapturePhaseEvent } from "../src/daytona/types";
import { content, inspectFixture, intro, loader, ordinaryCta, protectedGate } from "./fixtures/readiness-pages";

const viewport = { width: 1024, height: 768 };

function sandboxForFrames(frames: ReadinessSnapshot[], clickError?: Error) {
  let probes = 0;
  const clicks: number[][] = [];
  const commands: string[] = [];
  const sandbox = {
    process: {
      async executeCommand(command: string) {
        commands.push(command);
        if (command.includes("pip install")) return { exitCode: 0, result: "" };
        const frame = frames[Math.min(probes++, frames.length - 1)];
        return { exitCode: 0, result: JSON.stringify(frame) };
      },
    },
    computerUse: { mouse: { async click(x: number, y: number) {
      clicks.push([x, y]);
      if (clickError) throw clickError;
    } } },
  } as unknown as Sandbox;
  return { sandbox, clicks, commands, get probes() { return probes; } };
}

test("fixture inspection distinguishes a loader, intro overlay, and ordinary Enter/Start CTA", () => {
  expect(inspectFixture(loader).state).toBe("loading");
  expect(inspectFixture(intro)).toMatchObject({ state: "gate", target: { x: 512, y: 380 } });
  expect(inspectFixture(content).state).toBe("ready");
  expect(inspectFixture(ordinaryCta).state).toBe("ready");
  expect(inspectFixture(ordinaryCta.replace('<main ', '<main data-position="fixed" ')).state).toBe("ready");
  expect(inspectFixture(content, "interactive").reason).toBe("document_loading");
});

test("hidden loaders, inline progress indicators, and nonblocking cookie banners are not gates", () => {
  expect(inspectFixture(loader.replace('id="preloader"', 'id="preloader" hidden')).state).toBe("ready");
  expect(inspectFixture(`${content}<div role="progressbar">Loading preview</div>`).state).toBe("ready");
  const banner = `<div data-position="fixed" data-rect="0,650,1024,118">Cookies <button>Accept</button></div>`;
  expect(inspectFixture(content + banner).state).toBe("ready");
});

test("a fixed app shell does not hide a nested intro gate or loader from inspection", () => {
  const fixedShell = (html: string) => `<main data-position="fixed" data-rect="0,0,1024,768">${html}</main>`;
  expect(inspectFixture(fixedShell(intro)).state).toBe("gate");
  expect(inspectFixture(fixedShell(loader)).state).toBe("loading");
});

for (const copy of [
  "Log in to continue", "Sign up for an account", "Accept cookies to enter", "Agree to our terms",
  "Privacy choices", "Confirm your age", "You must be over 18", "Subscribe to continue",
  "Verify you are human", "Security verification", "Connect your wallet", "Allow notifications",
  "Cookies", "I am 18 or older", "Sign-in required",
]) {
  test(`does not interact with protected gate: ${copy}`, () => {
    expect(inspectFixture(protectedGate(copy))).toMatchObject({ state: "blocked", reason: "protected_gate" });
  });
}

for (const markup of [
  '<input type="password">', '<form></form>', '<iframe title="challenge"></iframe>',
  '<select><option>Country</option></select>', '<div data-shadow></div>',
]) {
  test(`protected or unreadable gate controls are not allowlisted: ${markup}`, () => {
    expect(inspectFixture(protectedGate("Welcome", markup)).reason).toBe("protected_gate");
  });
}

test("ambiguous, disabled, occluded, link, and unlabeled entry gates fail closed", () => {
  const cases = [
    intro.replace("Enter site", "Enter"), intro.replace("Enter site", "Start"),
    intro.replace('id="intro-gate"', 'id="overlay"'),
    intro.replace('<button data-rect', '<button disabled data-rect'),
    intro.replace('<button data-rect', '<button form="hidden-login" data-rect'),
    intro.replace('<button data-rect', '<button type="submit" data-rect'),
    intro.replace('<button data-rect', '<button data-pointer-events="none" data-rect'),
    intro.replace('<button data-rect', '<a href="/enter" data-rect').replace('Enter site</button>', 'Enter site</a>'),
    intro.slice(content.length).replace('data-position="fixed"', 'data-position="static"'),
  ];
  for (const html of cases) expect(inspectFixture(html).state).toBe("blocked");
});

test("protected gate markers cannot be disguised with a benign button label", () => {
  for (const marker of ["age-gate", "cookie-consent intro", "auth-gate", "captcha-gate"]) {
    expect(inspectFixture(intro.replace('id="intro-gate"', `id="${marker}"`)).reason).toBe("protected_gate");
  }
});

test("blank pages wait, while a visible canvas is content", () => {
  expect(inspectFixture("<div></div>").reason).toBe("blank_page");
  expect(inspectFixture('<canvas data-rect="0,0,1024,768"></canvas>').state).toBe("ready");
});

test("disappearing loader waits for two content frames without clicking", async () => {
  const fake = sandboxForFrames([inspectFixture(loader), inspectFixture(content), inspectFixture(content)]);
  await waitForCaptureReadiness(fake.sandbox, { viewport, timeoutMs: 2000 });
  expect(fake.probes).toBe(3);
  expect(fake.clicks).toEqual([]);
});

test("benign intro uses one Computer Use click and verifies the resulting content", async () => {
  const fake = sandboxForFrames([inspectFixture(intro), inspectFixture(intro), inspectFixture(content), inspectFixture(content)]);
  const events: CapturePhaseEvent[] = [];
  await waitForCaptureReadiness(fake.sandbox, { viewport, timeoutMs: 2500, onPhase: (event) => events.push(event) });
  expect(fake.clicks).toEqual([[512, 380]]);
  expect(fake.probes).toBe(4);
  expect(events.at(-1)).toMatchObject({ status: "ok", detail: "content ready after intro click" });
  expect(fake.commands.filter((c) => c.includes("pip install"))).toHaveLength(1);
  const scriptCommand = fake.commands.find((c) => c.includes("getdesign-cdp-readiness.py"))!;
  const script = Buffer.from(scriptCommand.split(" ")[1]!, "base64").toString();
  expect(script).toContain("127.0.0.1:9222/json");
  expect(script).toContain("Runtime.evaluate");
  expect(script).not.toMatch(/Input\.|\.click\(|dispatchEvent|captureScreenshot|Page\.navigate/);
});

test("ordinary Enter CTA is not clicked", async () => {
  const fake = sandboxForFrames([inspectFixture(ordinaryCta)]);
  await waitForCaptureReadiness(fake.sandbox, { viewport, timeoutMs: 1500 });
  expect(fake.clicks).toEqual([]);
});

for (const [name, html, expectedReason, clicks] of [
  ["persistent loader", loader, "loader_visible", 0],
  ["persistent intro", intro, "persistent_gate", 1],
] as const) {
  test(`${name} times out rather than becoming a successful capture`, async () => {
    const fake = sandboxForFrames([inspectFixture(html)]);
    const events: CapturePhaseEvent[] = [];
    await expect(waitForCaptureReadiness(fake.sandbox, { viewport, timeoutMs: 1200, onPhase: (e) => events.push(e) }))
      .rejects.toMatchObject({ code: "capture_not_ready", reason: expectedReason });
    expect(fake.clicks).toHaveLength(clicks);
    expect(fake.probes).toBeLessThanOrEqual(3);
    expect(events.at(-1)?.status).toBe("error");
    expect(events.some((e) => e.status === "ok")).toBe(false);
  });
}

test("protected gates fail with actionable guidance and no click", async () => {
  const fake = sandboxForFrames([inspectFixture(protectedGate("Accept cookies"))]);
  await expect(waitForCaptureReadiness(fake.sandbox, { viewport })).rejects.toThrow("Use a public, ungated URL");
  expect(fake.clicks).toEqual([]);
});

test("Computer Use errors propagate without another click", async () => {
  const failure = new Error("Computer Use unavailable");
  const fake = sandboxForFrames([inspectFixture(intro)], failure);
  await expect(waitForCaptureReadiness(fake.sandbox, { viewport })).rejects.toBe(failure);
  expect(fake.clicks).toHaveLength(1);
});

test("changed content geometry resets the settle window", async () => {
  const ready = inspectFixture(content);
  const fake = sandboxForFrames([ready, { ...ready, signature: "changed" }, { ...ready, signature: "changed" }]);
  await waitForCaptureReadiness(fake.sandbox, { viewport, timeoutMs: 2000 });
  expect(fake.probes).toBe(3);
});

test("viewport mismatch refuses a click", async () => {
  const fake = sandboxForFrames([inspectFixture(intro)]);
  await expect(waitForCaptureReadiness(fake.sandbox, { viewport: { width: 1440, height: 900 } }))
    .rejects.toMatchObject({ reason: "unsafe_gate_coordinates" });
  expect(fake.clicks).toEqual([]);
});

test("unavailable or invalid probes fail rather than allowing visual-stability success on a static gate", async () => {
  const fake = sandboxForFrames([{} as ReadinessSnapshot]);
  await expect(waitForCaptureReadiness(fake.sandbox, { viewport })).rejects.toMatchObject({ reason: "probe_unavailable" });
  expect(fake.clicks).toEqual([]);
  await expect(measurePageReadiness(fake.sandbox, 100)).rejects.toThrow("Invalid readiness measurement");
});

test("a hanging probe is bounded by the whole readiness deadline", async () => {
  const sandbox = { process: { executeCommand: () => new Promise(() => {}) } } as unknown as Sandbox;
  await expect(waitForCaptureReadiness(sandbox, { viewport, timeoutMs: 30 })).rejects.toBeInstanceOf(CaptureReadinessError);
});

test("non-finite or invalid budgets cannot create an unbounded wait", async () => {
  for (const timeoutMs of [NaN, Infinity, 0, -1]) {
    const fake = sandboxForFrames([inspectFixture(content)]);
    await expect(waitForCaptureReadiness(fake.sandbox, { viewport, timeoutMs })).rejects.toThrow("positive finite");
    expect(fake.probes).toBe(0);
  }
});
