import type { StudioOAuthProviderInfo } from "../../../shared/studio-api";

/**
 * Human-readable label for a Pi model provider id (matches OAuth display name when present).
 */
export function formatProviderDisplayName(
  providerId: string,
  oauthProviders: StudioOAuthProviderInfo[] | undefined,
): string {
  const oauth = oauthProviders?.find((p) => p.id === providerId);
  if (oauth) return oauth.name;
  return prettifyRawProviderId(providerId);
}

function prettifyRawProviderId(id: string): string {
  if (!id || id === "unknown") return "Other";
  return id
    .split(/[-_./]+/)
    .filter(Boolean)
    .map(
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}
