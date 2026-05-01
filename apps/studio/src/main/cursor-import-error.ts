/**
 * Shared copy for Cursor SDK import failures (native bindings / MODULE_NOT_FOUND).
 * Used from lazy loaders so messaging stays consistent across IPC surfaces.
 */
export const CURSOR_SDK_NATIVE_BINDINGS_MESSAGE =
  "Cursor SDK native dependencies aren't built for this Electron " +
  "runtime. Run `bun install` (or `npm rebuild`) inside apps/studio " +
  "to compile the SDK's native bindings, then restart Studio.";

export function isLikelyCursorNativeBindingsFailure(message: string): boolean {
  return /bindings|node_sqlite3|MODULE_NOT_FOUND/i.test(message);
}

export function normalizeCursorSdkImportError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (isLikelyCursorNativeBindingsFailure(message)) {
    return new Error(CURSOR_SDK_NATIVE_BINDINGS_MESSAGE);
  }
  return new Error(`Could not load @cursor/sdk: ${message}`);
}
