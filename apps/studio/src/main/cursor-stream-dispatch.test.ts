import { describe, expect, test } from "bun:test";
import {
  dispatchCursorStreamEvent,
  type CursorStreamDispatchCallbacks,
} from "./cursor-stream-dispatch";

describe("dispatchCursorStreamEvent", () => {
  function collect(): {
    callbacks: CursorStreamDispatchCallbacks;
    texts: string[];
    thinking: string[];
    errors: string[];
  } {
    const texts: string[] = [];
    const thinking: string[] = [];
    const errors: string[] = [];
    return {
      texts,
      thinking,
      errors,
      callbacks: {
        onTextDelta: (d) => texts.push(d),
        onThinkingDelta: (d) => thinking.push(d),
        onError: (m) => errors.push(m),
      },
    };
  }

  test("assistant text blocks", () => {
    const { callbacks, texts } = collect();
    const result = dispatchCursorStreamEvent(
      {
        type: "assistant",
        message: {
          content: [{ type: "text", text: "hello" }, { type: "text", text: " world" }],
        },
      },
      callbacks,
    );
    expect(result).toBe("continue");
    expect(texts).toEqual(["hello", " world"]);
  });

  test("thinking", () => {
    const { callbacks, thinking } = collect();
    dispatchCursorStreamEvent({ type: "thinking", text: "hm" }, callbacks);
    expect(thinking).toEqual(["hm"]);
  });

  test("tool_call running surfaces markdown hint", () => {
    const { callbacks, texts } = collect();
    dispatchCursorStreamEvent(
      { type: "tool_call", status: "running", name: "read_file" },
      callbacks,
    );
    expect(texts.join("")).toContain("read_file");
  });

  test("status ERROR aborts", () => {
    const { callbacks, errors } = collect();
    const result = dispatchCursorStreamEvent(
      { type: "status", status: "ERROR", message: "boom" },
      callbacks,
    );
    expect(result).toBe("abort");
    expect(errors).toEqual(["boom"]);
  });

  test("unknown types are noop", () => {
    const { callbacks, texts, errors } = collect();
    expect(dispatchCursorStreamEvent({ type: "task" }, callbacks)).toBe("continue");
    expect(texts).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});
