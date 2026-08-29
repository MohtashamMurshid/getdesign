import { expect, test } from "bun:test"

import { waitForStepGroup } from "./run-pipeline"

test("waits for sibling steps before surfacing a group failure", async () => {
  let finishExtract!: () => void
  const extractFinished = new Promise<void>((resolve) => {
    finishExtract = resolve
  })
  const captureError = new Error("capture failed")

  let groupSettled = false
  const failure = waitForStepGroup(["capture", "extract"], async (step) => {
    if (step === "capture") throw captureError
    await extractFinished
  }).then(
    () => null,
    (error: unknown) => error
  )
  void failure.finally(() => {
    groupSettled = true
  })

  await Promise.resolve()
  await Promise.resolve()
  expect(groupSettled).toBe(false)

  finishExtract()
  expect(await failure).toBe(captureError)
  expect(groupSettled).toBe(true)
})
