/**
 * Maps one Cursor agent stream event to callbacks. Keeps SDK wiring out of
 * presentation policy tests (deltas vs markdown tool hints).
 */

export type CursorStreamDispatchCallbacks = {
  onTextDelta(delta: string): void;
  onThinkingDelta(delta: string): void;
  onError(message: string): void;
};

export type CursorStreamDispatchResult = "continue" | "abort";

/**
 * Handles a single event object from `run.stream()` using structural checks
 * only so tests do not need `@cursor/sdk` types.
 */
export function dispatchCursorStreamEvent(
  event: unknown,
  callbacks: CursorStreamDispatchCallbacks,
): CursorStreamDispatchResult {
  if (!event || typeof event !== "object") return "continue";
  const e = event as Record<string, unknown>;
  const type = e.type;

  switch (type) {
    case "assistant": {
      const message = e.message;
      const blocks =
        message &&
        typeof message === "object" &&
        Array.isArray((message as Record<string, unknown>).content)
          ? ((message as Record<string, unknown>).content as unknown[])
          : [];
      for (const block of blocks) {
        if (!block || typeof block !== "object") continue;
        const b = block as Record<string, unknown>;
        if (b.type === "text" && typeof b.text === "string") {
          callbacks.onTextDelta(b.text);
        }
      }
      break;
    }
    case "thinking": {
      if (typeof e.text === "string" && e.text) {
        callbacks.onThinkingDelta(e.text);
      }
      break;
    }
    case "tool_call": {
      if (e.status === "running" && typeof e.name === "string") {
        callbacks.onTextDelta(`\n\n_Running tool: \`${e.name}\`_\n`);
      }
      break;
    }
    case "status": {
      if (e.status === "ERROR" && typeof e.message === "string") {
        callbacks.onError(e.message);
        return "abort";
      }
      break;
    }
    default:
      break;
  }

  return "continue";
}
