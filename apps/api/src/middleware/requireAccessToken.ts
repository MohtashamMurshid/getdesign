import type { Context, MiddlewareHandler } from "hono";

import type { VerifyAccessTokenFn } from "../auth";

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer[ \t]+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

function unauthorized(c: Context) {
  return c.json({ error: "unauthorized" }, 401, {
    "WWW-Authenticate": "Bearer",
  });
}

export function requireAccessToken(
  verifyAccessToken: VerifyAccessTokenFn,
): MiddlewareHandler {
  return async (c, next) => {
    const token = parseBearerToken(c.req.header("authorization"));
    if (!token) {
      return unauthorized(c);
    }

    try {
      const identity = await verifyAccessToken(token);
      if (!identity.userId) {
        return unauthorized(c);
      }
    } catch {
      return unauthorized(c);
    }

    await next();
  };
}
