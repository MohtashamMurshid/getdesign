import { describe, expect, test } from "bun:test";
import { buildAnalyticsConfig, readConfig } from "../src/config";
import { allowlistedProperties, sanitizeEvent } from "../src/schema";
import { relayAnalytics } from "../src/relay";
import { anonymousId, config, grantedCookie, userId } from "./helpers";

const serialized = JSON.stringify(config);
const uuid = anonymousId;
const sensitive = {
  email: "private@example.test",
  providerKey: "sk-provider-key",
  accessToken: "auth-token",
  url: "https://private.test/?token=raw",
  content: "generated content",
  error: "raw stack",
  $referrer: "https://referrer.test/?secret=1",
  $current_url: "https://site.test/auth?code=secret",
  arbitrary: { secret: "hidden" },
};

describe("configuration fails closed", () => {
  const env = {
    POSTHOG_ENABLED: "true",
    POSTHOG_PROJECT_ENV: "development",
    NODE_ENV: "development",
    POSTHOG_PROJECT_TOKEN: config.token,
    POSTHOG_HOST: config.host,
    POSTHOG_ALLOWED_ORIGINS: config.origins.join(","),
  };
  test("all required settings and exact current origin are needed", () => {
    expect(readConfig(buildAnalyticsConfig(env), config.origins[0])).toEqual(
      config,
    );
    for (const name of [
      "POSTHOG_ENABLED",
      "POSTHOG_PROJECT_ENV",
      "POSTHOG_PROJECT_TOKEN",
      "POSTHOG_HOST",
      "POSTHOG_ALLOWED_ORIGINS",
    ]) {
      expect(buildAnalyticsConfig({ ...env, [name]: undefined })).toBe("null");
    }
    expect(readConfig(serialized, "http://localhost:3000")).toBeNull();
    expect(readConfig("invalid", config.origins[0])).toBeNull();
    expect(
      buildAnalyticsConfig({
        ...env,
        POSTHOG_HOST: "https://evil.test/path?secret=1",
      }),
    ).toBe("null");
  });
  test("preview cannot inherit a production configuration", () => {
    const prod = {
      ...env,
      NODE_ENV: "production",
      POSTHOG_PROJECT_ENV: "production",
      POSTHOG_DEPLOYMENT_ENV: "production",
      POSTHOG_ALLOWED_ORIGINS:
        "https://www.getdesign.app,https://dashboard.getdesign.app",
    };
    expect(JSON.parse(buildAnalyticsConfig(prod)).environment).toBe(
      "production",
    );
    expect(buildAnalyticsConfig({ ...prod, VERCEL_ENV: "preview" })).toBe(
      "null",
    );
    expect(
      buildAnalyticsConfig({
        ...prod,
        VERCEL_ENV: "preview",
        POSTHOG_PROJECT_ENV: "preview",
      }),
    ).toBe("null");
    expect(
      readConfig(buildAnalyticsConfig(prod), config.origins[0]),
    ).toBeNull();
    expect(
      buildAnalyticsConfig({
        ...env,
        POSTHOG_ALLOWED_ORIGINS: "https://dashboard.getdesign.app",
      }),
    ).toBe("null");
    expect(
      buildAnalyticsConfig({ ...prod, POSTHOG_DEPLOYMENT_ENV: undefined }),
    ).toBe("null");
  });
});

test("schema rebuild strips every unapproved property and rejects invalid event values", () => {
  const event = sanitizeEvent(
    {
      event: "cta_clicked",
      properties: {
        ...sensitive,
        distinct_id: anonymousId,
        cta: "hero_extract",
      },
    },
    "marketing",
    "production",
  );
  expect(event?.properties).toEqual({
    distinct_id: anonymousId,
    cta: "hero_extract",
    surface: "marketing",
    environment: "production",
    schema_version: 1,
    $geoip_disable: true,
    $process_person_profile: false,
  });
  for (const forbidden of Object.values(sensitive))
    expect(JSON.stringify(event)).not.toContain(JSON.stringify(forbidden));
  for (const name of [
    "$pageview",
    "$autocapture",
    "$snapshot",
    "$exception",
    "$set",
    "login",
    "unknown",
  ])
    expect(allowlistedProperties(name, sensitive)).toBeNull();
  expect(
    allowlistedProperties("cta_clicked", { cta: sensitive.url }),
  ).toBeNull();
  expect(
    allowlistedProperties("run_failed", {
      mode: "visual",
      step: sensitive.error,
      $insert_id: "a".repeat(64),
    }),
  ).toBeNull();
  expect(
    sanitizeEvent(
      {
        event: "design_md_downloaded",
        properties: { distinct_id: sensitive.email },
      },
      "dashboard",
      "preview",
    ),
  ).toBeNull();
  expect(
    sanitizeEvent(
      {
        event: "$identify",
        properties: {
          ...sensitive,
          distinct_id: userId,
          $anon_distinct_id: anonymousId,
        },
      },
      "dashboard",
      "production",
    )?.properties,
  ).not.toHaveProperty("email");
});

test("relay validates consent again, ignores headers/query/raw properties, and never forwards replay", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const transport = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), init });
    return new Response("{}");
  }) as typeof fetch;
  function request(
    event = "cta_clicked",
    cookie = grantedCookie,
    origin = config.origins[0],
  ) {
    return new Request(`${config.origins[0]}/api/analytics/e/?auth=SECRET`, {
      method: "POST",
      headers: {
        origin,
        cookie,
        Authorization: "Bearer SECRET",
        Referer: "https://secret.test",
        "x-forwarded-for": "192.0.2.1",
      },
      body: JSON.stringify({
        event,
        uuid,
        $set: sensitive,
        properties: {
          ...sensitive,
          cta: "hero_extract",
          distinct_id: anonymousId,
        },
      }),
    });
  }
  for (const req of [
    request("$snapshot"),
    request("cta_clicked", ""),
    request("cta_clicked", "gd_analytics_consent_v1_development=denied"),
    request("cta_clicked", grantedCookie, "https://evil.test"),
  ])
    await relayAnalytics(req, serialized, "marketing", transport);
  await relayAnalytics(request(), "null", "marketing", transport);
  expect(calls).toHaveLength(0);
  await relayAnalytics(request(), serialized, "marketing", transport);
  expect(calls).toHaveLength(1);
  const call = calls[0];
  expect(call.url).toBe(`${config.host}/i/v0/e/`);
  expect(call.init?.headers).toEqual({ "Content-Type": "application/json" });
  expect(call.init?.referrerPolicy).toBe("no-referrer");
  expect(call.init?.credentials).toBe("omit");
  const payload = JSON.parse(String(call.init?.body));
  expect(payload.distinct_id).toBe(anonymousId);
  expect(payload.api_key).toBe(config.token);
  expect(payload.properties.$process_person_profile).toBe(false);
  expect(JSON.stringify(call)).not.toContain("SECRET");
  for (const key of Object.keys(sensitive))
    expect(payload.properties).not.toHaveProperty(key);
  const blocked = request();
  blocked.headers.set("sec-gpc", "1");
  await relayAnalytics(blocked, serialized, "marketing", transport);
  expect(calls).toHaveLength(1);
});
