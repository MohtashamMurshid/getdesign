import { describe, expect, test } from "bun:test";

import {
  textOnlyResumePatch,
  textOnlyResumeRejection,
} from "./designRunPolicy";

const pendingRun = {
  status: "failed" as const,
  steps: {
    crawl: "ok" as const,
    capture: "failed" as const,
    describe: "pending" as const,
    extract: "ok" as const,
    synthesize: "pending" as const,
    render: "pending" as const,
  },
  traceEvents: [],
};

describe("text-only resume policy", () => {
  test("rejects completed runs and successful captures", () => {
    expect(
      textOnlyResumeRejection({ ...pendingRun, status: "completed" }),
    ).toEqual({
      code: "ALREADY_COMPLETED",
      message: "Run already completed.",
    });
    expect(
      textOnlyResumeRejection({
        ...pendingRun,
        steps: { ...pendingRun.steps, capture: "ok" },
      }),
    ).toEqual({
      code: "CAPTURE_ALREADY_OK",
      message: "Visual capture already succeeded.",
    });
  });

  test("rejects continuation while a sibling pipeline step is running", () => {
    expect(
      textOnlyResumeRejection({
        ...pendingRun,
        steps: { ...pendingRun.steps, extract: "running" },
      }),
    ).toEqual({
      code: "STEP_RUNNING",
      message:
        "Wait for the active run steps to finish before continuing without screenshots.",
    });
  });

  test("marks capture skipped only after explicit continuation", () => {
    expect(textOnlyResumeRejection(pendingRun)).toBeNull();
    const patch = textOnlyResumePatch(pendingRun, 123);

    expect(patch.mode).toBe("text_only");
    expect(patch.steps.capture).toBe("skipped");
    expect(patch.steps.extract).toBe("ok");
    expect(patch.traceEvents.at(-1)).toEqual({
      step: "capture",
      status: "skipped",
      message: "Continuing without screenshots",
      at: 123,
    });
  });
});
