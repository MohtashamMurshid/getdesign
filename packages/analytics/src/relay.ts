import { consentFromCookie, readConfig } from "./config";
import { sanitizeEvent, type Surface } from "./schema";

/** Deliberately not a general PostHog proxy. Only allowlisted events can leave the app. */
export async function relayAnalytics(
  request: Request,
  serializedConfig: string | undefined,
  surface: Surface,
  transport: typeof fetch = fetch,
): Promise<Response> {
  const done = () =>
    new Response("{}", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  const origin = new URL(request.url).origin;
  const config = readConfig(serializedConfig, origin);
  if (
    !config ||
    request.method !== "POST" ||
    request.headers.get("origin") !== origin ||
    request.headers.get("sec-gpc") === "1" ||
    request.headers.get("dnt") === "1" ||
    consentFromCookie(request.headers.get("cookie") ?? "", config) !== "granted"
  )
    return done();
  // No forwarding of request headers, query parameters, referrers, IPs, or raw bodies.
  try {
    const body = await request.text();
    if (body.length > 16_384) return done();
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return done();
    // The pinned SDK wraps even unbatched captures in a single-event envelope.
    const envelope = parsed as { batch?: unknown };
    const candidate =
      envelope.batch === undefined
        ? parsed
        : Array.isArray(envelope.batch) && envelope.batch.length === 1
          ? envelope.batch[0]
          : null;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      return done();
    const input = candidate as {
      event?: unknown;
      properties?: unknown;
      uuid?: unknown;
      timestamp?: unknown;
    };
    if (
      typeof input.event !== "string" ||
      !input.properties ||
      typeof input.properties !== "object" ||
      Array.isArray(input.properties)
    )
      return done();
    const clean = sanitizeEvent(
      {
        event: input.event,
        properties: input.properties as Record<string, unknown>,
      },
      surface,
      config.environment,
    );
    if (
      !clean ||
      typeof input.uuid !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input.uuid,
      )
    )
      return done();
    const time =
      typeof input.timestamp === "string"
        ? Date.parse(input.timestamp)
        : Date.now();
    if (!Number.isFinite(time) || Math.abs(Date.now() - time) > 3_600_000)
      return done();
    await transport(`${config.host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: config.token,
        distinct_id: clean.properties.distinct_id,
        uuid: input.uuid,
        timestamp: new Date(time).toISOString(),
        ...clean,
      }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    /* Drop without logging payloads, provider responses, or raw errors. */
  }
  // Best effort, no relay retries or collection queue. Product behavior is independent.
  return done();
}
