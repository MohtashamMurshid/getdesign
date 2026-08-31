import { beforeEach, expect, mock, test } from "bun:test";
import { getFunctionName } from "convex/server";

type Fixture = {
  normalizedUrl: string;
  status: string;
  mode?: string;
  startedAt?: number;
  error?: { step: string; message: string };
  steps: Record<string, string>;
};
let run: Fixture;
let failRender = false;
let failFinalRead = false;
let savedMarkdown = false;
let reads = 0;
const query = mock(async (reference: Parameters<typeof getFunctionName>[0]) => {
  const name = getFunctionName(reference);
  if (name === "designRunArtifacts:getForRun")
    return {
      doc: {},
      crawl: { sourceUrl: "https://secret.test", stylesheets: [] },
    };
  reads++;
  if (failFinalRead && reads > 1) throw new Error("read unavailable");
  return structuredClone(run);
});
const mutation = mock(
  async (
    reference: Parameters<typeof getFunctionName>[0],
    args: Record<string, any>,
  ) => {
    const name = getFunctionName(reference);
    if (name === "designRuns:beginStep") {
      run.status = "running";
      run.startedAt ??= 123;
    }
    if (name === "designRunArtifacts:upsertValue" && args.kind === "markdown")
      savedMarkdown = true;
    if (name === "designRuns:finishStep") {
      if (args.step === "render") expect(savedMarkdown).toBe(true);
      run.steps[args.step] = args.status;
      Object.assign(run, args.patch);
    }
    if (name === "designRuns:failStep") {
      run.status = "failed";
      run.error = { step: args.step, message: args.message };
    }
    return null;
  },
);
mock.module("@workos-inc/authkit-nextjs", () => ({
  withAuth: async () => ({
    user: { id: "user_01ARZ3NDEKTSV4RRFFQ69G5FAV" },
    accessToken: "fixture-auth",
  }),
}));
mock.module("@/lib/convex-server", () => ({
  getConvexClient: () => ({ query, mutation }),
}));
mock.module("@getdesign/agent", () => ({
  resolveModel: mock(),
  runCrawl: mock(),
  runDescribe: mock(),
  runExtractTokens: mock(),
  runSynthesize: mock(),
  runVisual: mock(),
}));
mock.module("@getdesign/tools/render", () => ({
  renderDesignMd: () => {
    if (failRender)
      throw new Error("SECRET provider error https://secret.test");
    return "# PRIVATE generated markdown";
  },
}));
const { runStepHandler } = await import("../app/api/runs/[id]/_run-step");
const invoke = () =>
  runStepHandler("render")(
    new Request("http://localhost:3014/api/runs/fixture/render", {
      method: "POST",
    }),
    { params: Promise.resolve({ id: "fixture" }) },
  );

beforeEach(() => {
  run = {
    normalizedUrl: "https://secret.test",
    status: "running",
    startedAt: 123,
    steps: { render: "pending" },
  };
  failRender = false;
  failFinalRead = false;
  savedMarkdown = false;
  reads = 0;
  query.mockClear();
  mutation.mockClear();
});

test("completion receipt exists only after markdown storage and final persistence", async () => {
  const response = await invoke();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.analytics).toEqual({
    started: false,
    completed: true,
    mode: "visual",
  });
  expect(JSON.stringify(body.analytics)).not.toMatch(
    /PRIVATE|secret.test|fixture-auth/,
  );
});

test("first actual step transition acknowledges start; queued alone never does", async () => {
  run.status = "queued";
  delete run.startedAt;
  const response = await invoke();
  expect((await response.json()).analytics.started).toBe(true);
});

test("skipped/completed step requests produce no historical completion receipt", async () => {
  run.status = "completed";
  run.steps.render = "ok";
  expect(await (await invoke()).json()).toEqual({ ok: true, skipped: true });
  expect(mutation).not.toHaveBeenCalled();
});

test("persisted failure receipt has an allowlisted step, never the raw error", async () => {
  failRender = true;
  const response = await invoke();
  expect(response.status).toBe(500);
  const body = await response.json();
  expect(body.analytics).toEqual({
    started: false,
    completed: false,
    failedStep: "render",
    mode: "visual",
  });
  expect(JSON.stringify(body.analytics)).not.toMatch(/SECRET|secret.test/);
  expect(savedMarkdown).toBe(false);
});

test("analytics-only read failures do not change completed runs into failed runs", async () => {
  failFinalRead = true;
  const response = await invoke();
  expect(response.status).toBe(200);
  expect(run.status).toBe("completed");
  expect(await response.json()).toEqual({ ok: true });
});
