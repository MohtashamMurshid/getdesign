/**
 * Electron's `ipcRenderer.invoke()` wraps thrown handler errors as
 * `Error invoking remote method '<channel>': Error: <original message>`.
 * Strip that wrapper so the user sees the message we actually want to show.
 */
const IPC_PREFIX = /^Error invoking remote method '[^']+': (Error: )?/;

export function toErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(IPC_PREFIX, "");
}
