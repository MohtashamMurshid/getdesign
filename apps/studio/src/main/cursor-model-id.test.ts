import { describe, expect, test } from "bun:test";
import {
  bareCursorModelId,
  CURSOR_MODEL_PREFIX,
  isCursorModelId,
} from "./cursor-model-id";

describe("cursor-model-id", () => {
  test("isCursorModelId", () => {
    expect(isCursorModelId(undefined)).toBe(false);
    expect(isCursorModelId("gpt-4")).toBe(false);
    expect(isCursorModelId(`${CURSOR_MODEL_PREFIX}gpt-4`)).toBe(true);
  });

  test("bareCursorModelId strips prefix", () => {
    expect(bareCursorModelId(`${CURSOR_MODEL_PREFIX}opus`)).toBe("opus");
    expect(bareCursorModelId("anthropic/claude")).toBe("anthropic/claude");
  });
});
