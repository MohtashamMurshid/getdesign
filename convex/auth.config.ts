import type { AuthConfig } from "convex/server";

const clientId = process.env.WORKOS_CLIENT_ID?.trim();

if (!clientId) {
  throw new Error("WORKOS_CLIENT_ID is required for Convex authentication.");
}

export default {
  providers: [
    {
      type: "customJwt",
      issuer: "https://api.workos.com",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
