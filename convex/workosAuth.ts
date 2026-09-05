import { ConvexError } from "convex/values";
import type { AuthConfig } from "convex/server";

const WORKOS_ISSUER = "https://api.workos.com";

export function workosAuthProviders(
  clientId: string,
): AuthConfig["providers"] {
  const jwks = `${WORKOS_ISSUER}/sso/jwks/${clientId}`;

  return [
    {
      type: "customJwt",
      issuer: `${WORKOS_ISSUER}/`,
      jwks,
      algorithm: "RS256",
      applicationID: clientId,
    },
    {
      type: "customJwt",
      issuer: WORKOS_ISSUER,
      jwks,
      algorithm: "RS256",
      applicationID: clientId,
    },
    {
      type: "customJwt",
      issuer: `${WORKOS_ISSUER}/user_management/${clientId}`,
      jwks,
      algorithm: "RS256",
    },
  ];
}

type AuthContext = {
  auth: {
    getUserIdentity(): Promise<{
      subject: string;
    } | null>;
  };
};

export async function requireWorkOsUserId(
  ctx: AuthContext,
  expectedClientId = process.env.WORKOS_CLIENT_ID?.trim(),
): Promise<string> {
  if (!expectedClientId) {
    throw new ConvexError("WORKOS_CLIENT_ID is unset");
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  return identity.subject;
}
