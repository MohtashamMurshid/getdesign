import { expect, test } from "bun:test";

test("onboarding server and UI regression suite runs with isolated module mocks", async () => {
  const child = Bun.spawn({
    cmd: [process.execPath, "test", "./tests/onboarding-suite.tsx"],
    cwd: new URL("..", import.meta.url).pathname,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  expect(exitCode, `${stdout}\n${stderr}`).toBe(0);
  expect(`${stdout}\n${stderr}`).toMatch(/\b[1-9]\d* pass\b/);
}, 15_000);
