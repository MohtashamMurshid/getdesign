import { expect, test } from "bun:test";

test("analytics hooks follow persisted dashboard step lifecycle with isolated mocks", async () => {
  const child = Bun.spawn({
    cmd: [process.execPath, "test", "./tests/analytics-lifecycle-suite.ts"],
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
  expect(`${stdout}\n${stderr}`).toContain("5 pass");
});

test("design.md download instrumentation excludes failed dispatches and sensitive artifact data", async () => {
  const child = Bun.spawn({
    cmd: [process.execPath, "test", "./tests/analytics-download-suite.ts"],
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
  expect(`${stdout}\n${stderr}`).toContain("2 pass");
});
