/** Prefix for Cursor-backed models in Studio chat / registry strings. */
export const CURSOR_MODEL_PREFIX = "cursor/" as const;

export function isCursorModelId(modelId: string | undefined): boolean {
  return Boolean(modelId?.startsWith(CURSOR_MODEL_PREFIX));
}

/** Strip the Studio prefix before passing the id to `@cursor/sdk`. */
export function bareCursorModelId(modelId: string): string {
  return modelId.startsWith(CURSOR_MODEL_PREFIX)
    ? modelId.slice(CURSOR_MODEL_PREFIX.length)
    : modelId;
}
