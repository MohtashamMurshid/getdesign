const RESUME_CONFLICT_CODES = new Set([
  "ALREADY_COMPLETED",
  "CAPTURE_ALREADY_OK",
  "STEP_RUNNING",
])

export function textOnlyResumeErrorStatus(error: unknown): 409 | 500 {
  const data =
    error && typeof error === "object" && "data" in error
      ? (error as { data?: unknown }).data
      : undefined
  const code =
    data && typeof data === "object" && "code" in data
      ? (data as { code?: unknown }).code
      : undefined
  if (typeof code === "string" && RESUME_CONFLICT_CODES.has(code)) return 409

  const message = error instanceof Error ? error.message : String(error)
  return /already completed|already succeeded|STEP_RUNNING|active run steps/i.test(
    message
  )
    ? 409
    : 500
}
