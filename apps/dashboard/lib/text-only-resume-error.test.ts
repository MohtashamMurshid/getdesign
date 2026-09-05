import { describe, expect, test } from "bun:test"

import { textOnlyResumeErrorStatus } from "./text-only-resume-error"

describe("text-only resume error status", () => {
  test("maps the structured running-step rejection to conflict", () => {
    expect(
      textOnlyResumeErrorStatus({
        data: { code: "STEP_RUNNING", message: "Still running." },
      })
    ).toBe(409)
  })

  test("maps serialized Convex conflicts and leaves other failures as 500", () => {
    expect(
      textOnlyResumeErrorStatus(
        new Error('ConvexError: {"code":"STEP_RUNNING"}')
      )
    ).toBe(409)
    expect(textOnlyResumeErrorStatus(new Error("Connection failed."))).toBe(500)
  })
})
