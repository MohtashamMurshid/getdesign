type CaptureOutcome = {
  status: "captured" | "skipped" | "failed";
  reason?: string;
};

export function captureFailureMessage(result: CaptureOutcome): string | null {
  if (result.status === "captured") return null;
  return result.reason ?? "Visual capture failed.";
}
