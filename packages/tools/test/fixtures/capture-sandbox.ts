import { spyOn } from "bun:test";
import { Daytona, type Sandbox } from "@daytonaio/sdk";
import sharp from "sharp";

import type { CaptureSandbox } from "../../src/daytona/sandbox";
import type { ReadinessSnapshot } from "../../src/daytona/readiness-inspection";

const png = sharp({ create: { width: 1024, height: 768, channels: 3, background: "white" } }).png().toBuffer();

export function captureSandbox(frames: ReadinessSnapshot[], failures: {
  prepare?: Error; screenshot?: Error; cleanup?: Error; heightMeasurement?: boolean;
} = {}) {
  const state = { probes: 0, screenshots: 0, deleted: 0, clicks: [] as number[][], keys: [] as string[], commands: [] as string[] };
  const sandbox = {
    __captureViewport: { width: 1024, height: 768 },
    process: { async executeCommand(command: string) {
      state.commands.push(command);
      if (command.includes("getdesign-cdp-readiness.py")) {
        return { exitCode: 0, result: JSON.stringify(frames[Math.min(state.probes++, frames.length - 1)]) };
      }
      if (command.includes("getdesign-cdp-probe.py")) {
        if (failures.heightMeasurement) return { exitCode: 1, result: "measurement unavailable" };
        return { exitCode: 0, result: JSON.stringify({ sw: 1024, sh: 1800, dpr: 1, ready: "complete" }) };
      }
      if (command.includes("/json/version")) return { exitCode: 0, result: "200" };
      if (command.includes("pip install") || command.includes("getdesign-chromium.sh")) return { exitCode: 0, result: "" };
      throw new Error(`Unexpected sandbox command: ${command}`);
    } },
    computerUse: {
      async start() { if (failures.prepare) throw failures.prepare; },
      mouse: { async click(x: number, y: number) { state.clicks.push([x, y]); } },
      keyboard: { async press(key: string) { state.keys.push(key); } },
      screenshot: { async takeCompressed() {
        state.screenshots += 1;
        if (failures.screenshot) throw failures.screenshot;
        return { screenshot: (await png).toString("base64"), width: 1024, height: 768 };
      } },
    },
    async delete() {
      state.deleted += 1;
      if (failures.cleanup) throw failures.cleanup;
    },
  } as unknown as CaptureSandbox;
  return { sandbox, state };
}

/** Mock the SDK boundary, not capture orchestration. No provider calls occur. */
export function mockSandboxCreation(sandboxes: CaptureSandbox[]) {
  const created: Sandbox[] = [];
  const spy = spyOn(Daytona.prototype, "create").mockImplementation(async () => {
    const sandbox = sandboxes[created.length];
    if (!sandbox) throw new Error("Unexpected sandbox creation");
    created.push(sandbox);
    return sandbox;
  });
  return { created, restore: () => spy.mockRestore() };
}
