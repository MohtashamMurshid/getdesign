import { describe, expect, test } from "bun:test";
import {
  CURSOR_SDK_NATIVE_BINDINGS_MESSAGE,
  isLikelyCursorNativeBindingsFailure,
  normalizeCursorSdkImportError,
} from "./cursor-import-error";

describe("cursor-import-error", () => {
  test("detects native binding failures", () => {
    expect(isLikelyCursorNativeBindingsFailure("Could not locate bindings")).toBe(true);
    expect(isLikelyCursorNativeBindingsFailure("node_sqlite3.node")).toBe(true);
    expect(isLikelyCursorNativeBindingsFailure("MODULE_NOT_FOUND")).toBe(true);
    expect(isLikelyCursorNativeBindingsFailure("unrelated")).toBe(false);
  });

  test("normalizeCursorSdkImportError maps bindings to shared message", () => {
    const err = normalizeCursorSdkImportError(new Error("bindings missing"));
    expect(err.message).toBe(CURSOR_SDK_NATIVE_BINDINGS_MESSAGE);
  });

  test("normalizeCursorSdkImportError preserves generic load errors", () => {
    const err = normalizeCursorSdkImportError(new Error("syntax mistake"));
    expect(err.message).toBe("Could not load @cursor/sdk: syntax mistake");
  });
});
