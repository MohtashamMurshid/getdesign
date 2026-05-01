import { describe, expect, test } from "bun:test";
import { toCursorRunErrorMessage } from "./cursor-runtime-errors";

describe("toCursorRunErrorMessage", () => {
  test("formats Error", () => {
    expect(toCursorRunErrorMessage(new Error("x"))).toBe("x");
  });

  test("formats string", () => {
    expect(toCursorRunErrorMessage("plain")).toBe("plain");
  });

  test("handles unknown", () => {
    expect(toCursorRunErrorMessage(null)).toBe("Unknown Cursor error.");
    expect(toCursorRunErrorMessage(undefined)).toBe("Unknown Cursor error.");
  });
});
