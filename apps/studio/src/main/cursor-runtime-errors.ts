export function toCursorRunErrorMessage(error: unknown): string {
  if (!error) return "Unknown Cursor error.";
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
