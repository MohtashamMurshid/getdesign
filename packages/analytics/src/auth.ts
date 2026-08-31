import { consentFromCookie, readConfig } from "./config";
import { isUserId, sanitizeEvent } from "./schema";
import { eventDigest } from "./client";

/** WorkOS seals this server-authored state alongside its PKCE verifier. No user input. */
export function signupFlowState(
  consented: boolean,
  now = Date.now(),
): string | undefined {
  return consented
    ? JSON.stringify({ analyticsFlowStartedAt: now })
    : undefined;
}

export function isCompletedSignup(
  state: string | undefined,
  user: { createdAt: string; emailVerified: boolean },
  now = Date.now(),
): boolean {
  try {
    const started = JSON.parse(state ?? "null")?.analyticsFlowStartedAt;
    const created = Date.parse(user.createdAt);
    return (
      user.emailVerified &&
      Number.isFinite(started) &&
      started <= now &&
      now - started <= 600_000 &&
      created >= started &&
      created <= now
    );
  } catch {
    return false;
  }
}

/** Only call from AuthKit's successful, verified callback; never from a login render. */
export async function captureCompletedSignup(
  request: Request,
  serializedConfig: string | undefined,
  state: string | undefined,
  user: { id: string; createdAt: string; emailVerified: boolean },
  transport: typeof fetch = fetch,
) {
  const config = readConfig(serializedConfig, new URL(request.url).origin);
  if (
    !config ||
    !isUserId(user.id) ||
    !isCompletedSignup(state, user) ||
    consentFromCookie(request.headers.get("cookie") ?? "", config) !==
      "granted" ||
    request.headers.get("sec-gpc") === "1" ||
    request.headers.get("dnt") === "1"
  )
    return;
  try {
    const digest = await eventDigest(`signup_completed:${user.id}`);
    const clean = sanitizeEvent(
      {
        event: "signup_completed",
        properties: { distinct_id: user.id, $insert_id: digest },
      },
      "dashboard",
      config.environment,
    );
    const uuid = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
    await transport(`${config.host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: config.token,
        distinct_id: clean?.properties.distinct_id,
        uuid,
        timestamp: new Date().toISOString(),
        ...clean,
      }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    /* Authentication succeeds even when analytics is unavailable. */
  }
}
