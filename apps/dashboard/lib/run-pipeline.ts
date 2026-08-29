export async function waitForStepGroup<Step>(
  steps: readonly Step[],
  runStep: (step: Step) => Promise<void>
): Promise<void> {
  const results = await Promise.allSettled(steps.map((step) => runStep(step)))
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  )
  if (failure) throw failure.reason
}
