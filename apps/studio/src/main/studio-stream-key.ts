/**
 * Key for Pi streaming indices: isolates turn + contentIndex namespace logic.
 */
export function makeAssistantStreamKey(
  turn: number,
  contentIndex: number | undefined,
): string {
  return `${turn}:${contentIndex ?? "null"}`;
}
