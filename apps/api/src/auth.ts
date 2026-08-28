import { createRemoteJWKSet, jwtVerify } from "jose";

const WORKOS_ISSUER = "https://api.workos.com";

export type AccessTokenIdentity = {
  userId: string;
};

export type VerifyAccessTokenFn = (
  token: string,
) => Promise<AccessTokenIdentity>;

type RemoteJwkSet = ReturnType<typeof createRemoteJWKSet>;

let cachedClientId: string | undefined;
let cachedJwks: RemoteJwkSet | undefined;

function workosJwks(clientId: string): RemoteJwkSet {
  if (cachedJwks && cachedClientId === clientId) {
    return cachedJwks;
  }
  cachedClientId = clientId;
  cachedJwks = createRemoteJWKSet(
    new URL(`https://api.workos.com/sso/jwks/${clientId}`),
  );
  return cachedJwks;
}

/**
 * Production verifier for WorkOS AuthKit access tokens.
 * Fail closed when WORKOS_CLIENT_ID is unset.
 */
export const verifyWorkosAccessToken: VerifyAccessTokenFn = async (token) => {
  const clientId = process.env.WORKOS_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("WORKOS_CLIENT_ID is unset");
  }

  const { payload } = await jwtVerify(token, workosJwks(clientId), {
    issuer: WORKOS_ISSUER,
  });

  const userId = payload.sub;
  if (!userId) {
    throw new Error("Access token is missing sub");
  }

  return { userId };
};
