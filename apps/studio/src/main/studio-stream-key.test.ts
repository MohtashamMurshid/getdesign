import { describe, expect, test } from "bun:test";
import { makeAssistantStreamKey } from "./studio-stream-key";

describe("makeAssistantStreamKey", () => {
  test("embeds turn and content index", () => {
    expect(makeAssistantStreamKey(2, 1)).toBe("2:1");
  });

  test("uses null sentinel when contentIndex omitted", () => {
    expect(makeAssistantStreamKey(0, undefined)).toBe("0:null");
  });
});
