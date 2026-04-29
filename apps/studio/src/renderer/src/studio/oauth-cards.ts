import type { StudioOAuthProviderInfo } from "../../../shared/studio-api";

export type OauthCard = {
  id: string;
  name: string;
  description: string;
};

function descriptionForProviderId(providerId: string): string {
  if (providerId === "anthropic") return "Claude Pro or Max";
  if (providerId.includes("codex")) return "ChatGPT Plus or Pro";
  if (providerId.includes("antigravity")) return "Google Antigravity";
  if (providerId.includes("gemini")) return "Google Gemini CLI";
  return "Pi subscription login";
}

export function buildOauthProviderCards(
  oauthProviders: StudioOAuthProviderInfo[] | undefined,
): OauthCard[] {
  return (oauthProviders ?? []).map((oauthProvider) => ({
    id: oauthProvider.id,
    name: oauthProvider.name,
    description: descriptionForProviderId(oauthProvider.id),
  }));
}
