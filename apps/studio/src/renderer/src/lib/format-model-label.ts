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
