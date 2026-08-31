import { expect, test } from "bun:test";

test("real PostHog SDK uses only the redacted relay transport", async () => {
  const child = Bun.spawn({
    cmd: [process.execPath, "test", "./test/sdk-transport-suite.ts"],
    cwd: new URL("..", import.meta.url).pathname,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, error, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  expect(code, `${out}\n${error}`).toBe(0);
  expect(`${out}\n${error}`).toContain("1 pass");
});
