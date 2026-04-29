/**
 * Strips a leading `providerId/` from a model display name when it matches
 * the given provider (or when no provider filter is supplied).
 */
export function stripProviderPrefix(name: string, providerId?: string): string {
  if (!name) return name;
  const slash = name.indexOf("/");
  if (slash > 0) {
    const prefix = name.slice(0, slash).toLowerCase();
    if (!providerId || prefix === providerId.toLowerCase()) {
      return name.slice(slash + 1);
    }
  }
  return name;
}

/**
 * Removes trailing context-window marketing from Pi / registry display strings
 * so the picker shows a short model name only.
 */
export function stripModelContextSuffix(displayName: string): string {
  let s = displayName.trim();
  s = s.replace(/\s+\(\s*\d+k[^)]*\)\s*$/i, "");
  s = s.replace(/\s+[·•]\s*\d+k.*$/i, "");
  s = s.replace(
    /\s+\d+k(?:\s+input\s+tokens?(?:\s+available)?)?\.?\s*$/i,
    "",
  );
  return s.trim();
}

/** Label for model dropdowns: provider prefix off + no token-window suffix. */
export function formatModelPickerLabel(
  name: string,
  providerId?: string,
): string {
  return stripModelContextSuffix(stripProviderPrefix(name, providerId));
}
