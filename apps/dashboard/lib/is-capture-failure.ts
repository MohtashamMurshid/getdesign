const CAPTURE_CODE = "capture_failed";
const CAPTURE_HINT = /capture|daytona/i;

export function isCaptureFailure(error: unknown): boolean {
  if (error == null) return false;

  if (typeof error === "string") {
    return CAPTURE_HINT.test(error);
  }

  if (typeof error !== "object") return false;

  const record = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    reason?: unknown;
  };

  if (record.code === CAPTURE_CODE || record.name === CAPTURE_CODE) {
    return true;
  }

  return [record.message, record.reason].some(
    (value) => typeof value === "string" && CAPTURE_HINT.test(value),
  );
}
