export type TextOnlyResumeRun = {
  status: "queued" | "running" | "completed" | "failed";
  steps: Record<
    "crawl" | "capture" | "describe" | "extract" | "synthesize" | "render",
    "pending" | "running" | "ok" | "skipped" | "failed"
  >;
  traceEvents?: Array<Record<string, unknown>>;
};

export function textOnlyResumeRejection(run: TextOnlyResumeRun) {
  if (run.status === "completed") {
    return {
      code: "ALREADY_COMPLETED",
      message: "Run already completed.",
    } as const;
  }
  if (run.steps.capture === "ok") {
    return {
      code: "CAPTURE_ALREADY_OK",
      message: "Visual capture already succeeded.",
    } as const;
  }
  return null;
}

export function textOnlyResumePatch(run: TextOnlyResumeRun, now: number) {
  return {
    status: "running" as const,
    currentStep: "extract" as const,
    message: "Continuing without screenshots",
    mode: "text_only" as const,
    error: undefined,
    steps: { ...run.steps, capture: "skipped" as const },
    traceEvents: [
      ...(run.traceEvents ?? []),
      {
        step: "capture",
        status: "skipped",
        message: "Continuing without screenshots",
        at: now,
      },
    ],
    updatedAt: now,
  };
}
