import { expect, test } from "bun:test";
import { Window } from "happy-dom";
import { config, grantedCookie, userId } from "./helpers";
import { createAnalytics, eventDigest } from "../src/client";
import { relayAnalytics } from "../src/relay";

test("SDK defaults, identity, and explicit events pass through both privacy boundaries", async () => {
  const window = new Window({
    url: `${config.origins[0]}/runs/private-site?code=SECRET#sk-KEY`,
  });
  let activeConfig = config;
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const forwarded: Record<string, unknown>[] = [];
  const pending: Promise<unknown>[] = [];
  Object.defineProperty(window.document, "referrer", {
    value: "https://private.test/?email=secret@example.test",
  });
  const transport = (async (_url: unknown, options?: RequestInit) => {
    forwarded.push(JSON.parse(String(options?.body)));
    return new Response("{}");
  }) as typeof fetch;
  const mockFetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = new URL(String(input), window.location.origin).href;
    expect(url).toStartWith(`${window.location.origin}/api/analytics/e/`);
    const body =
      typeof init?.body === "string"
        ? init.body
        : await new Response(init?.body).text();
    requests.push({ url, body: JSON.parse(body) });
    const result = relayAnalytics(
      new Request(url, {
        method: "POST",
        body,
        headers: {
          origin: window.location.origin,
          cookie: window.document.cookie,
        },
      }),
      JSON.stringify(activeConfig),
      window.location.hostname === "www.getdesign.app"
        ? "marketing"
        : "dashboard",
      transport,
    );
    pending.push(result);
    return result;
  }) as typeof fetch;
  window.fetch = mockFetch as unknown as typeof window.fetch;
  Object.assign(globalThis, {
    window,
    document: window.document,
    navigator: window.navigator,
    location: window.location,
    self: window,
    fetch: mockFetch,
    XMLHttpRequest: window.XMLHttpRequest,
  });
  window.document.cookie = `${grantedCookie}; Path=/`;
  const { default: posthog, PostHog } = await import("posthog-js");
  const analytics = createAnalytics(config, "dashboard", {
    cookie: () => window.document.cookie,
    writeCookie: (value) => {
      window.document.cookie = value;
    },
    privacySignal: () => false,
    load: async () => posthog,
  });
  try {
    await analytics.sync();
    window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
    window.dispatchEvent(new window.Event("load"));
    expect(analytics.ready()).toBe(true);
    expect(posthog.has_opted_out_capturing()).toBe(false);
    expect(posthog.is_capturing()).toBe(true);
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36",
    });
    expect(posthog.get_distinct_id()).toMatch(/^[0-9a-f-]{36}$/);
    expect(requests).toHaveLength(0);
    posthog.set_config({ opt_out_useragent_filter: true }); // Synthetic DOM is a bot to the SDK.
    const captured = posthog.capture("cta_clicked", { cta: "hero_extract" });
    expect(captured).toBeDefined();
    analytics.identify(userId);
    analytics.capture({
      event: "run_completed",
      properties: { mode: "visual", $insert_id: await eventDigest("test-run") },
    });
    await Promise.all(pending);
    expect(
      requests.map(
        (request) => (request.body.batch as Array<{ event: string }>)[0].event,
      ),
    ).toEqual(["cta_clicked", "$identify", "run_completed"]);
    expect(forwarded).toHaveLength(3);
    expect(forwarded.map((event) => event.event)).toEqual([
      "cta_clicked",
      "$identify",
      "run_completed",
    ]);
    expect(JSON.stringify(requests)).not.toMatch(
      /SECRET|sk-KEY|private-site|secret@example|private.test/,
    );
    expect(JSON.stringify(forwarded)).not.toMatch(
      /SECRET|sk-KEY|private-site|secret@example|private.test/,
    );
    expect(window.document.cookie).not.toMatch(
      /SECRET|sk-KEY|private-site|secret@example/,
    );
    await analytics.setConsent("denied");
    analytics.capture({ event: "design_md_downloaded", properties: {} });
    await Promise.all(pending);
    expect(requests).toHaveLength(3);
    expect(posthog.get_distinct_id()).not.toBe(userId);
    // A formerly queued/retried request is stopped at the relay after withdrawal.
    await relayAnalytics(
      new Request(`${config.origins[0]}/api/analytics/e/`, {
        method: "POST",
        headers: {
          origin: window.location.origin,
          cookie: window.document.cookie,
        },
        body: JSON.stringify(requests[2].body),
      }),
      JSON.stringify(activeConfig),
      window.location.hostname === "www.getdesign.app"
        ? "marketing"
        : "dashboard",
      transport,
    );
    expect(forwarded).toHaveLength(3);

    await posthog.shutdown();
    activeConfig = {
      ...config,
      environment: "production",
      origins: ["https://www.getdesign.app", "https://dashboard.getdesign.app"],
    };
    window.happyDOM.setURL("https://www.getdesign.app/?campaign=SECRET");
    const marketingSdk = new PostHog();
    const marketing = createAnalytics(activeConfig, "marketing", {
      cookie: () => window.document.cookie,
      writeCookie: (value) => {
        window.document.cookie = value;
      },
      privacySignal: () => false,
      load: async () => marketingSdk,
    });
    await marketing.setConsent("granted");
    marketingSdk.set_config({ opt_out_useragent_filter: true });
    const journeyId = marketingSdk.get_distinct_id();
    marketing.capture({
      event: "cta_clicked",
      properties: { cta: "hero_extract" },
    });
    await Promise.all(pending);
    await marketingSdk.shutdown();
    window.happyDOM.setURL("https://dashboard.getdesign.app/");
    const dashboardSdk = new PostHog();
    const dashboard = createAnalytics(activeConfig, "dashboard", {
      cookie: () => window.document.cookie,
      writeCookie: (value) => {
        window.document.cookie = value;
      },
      privacySignal: () => false,
      load: async () => dashboardSdk,
    });
    try {
      await dashboard.sync();
      expect(dashboard.ready()).toBe(true);
      expect(dashboardSdk.get_distinct_id()).toBe(journeyId);
      dashboardSdk.set_config({ opt_out_useragent_filter: true });
      dashboard.identify(userId);
      dashboard.capture({
        event: "run_completed",
        properties: {
          mode: "visual",
          $insert_id: await eventDigest("first-shared-run"),
        },
      });
      await Promise.all(pending);
      const identify = forwarded.at(-2) as {
        event: string;
        properties: Record<string, unknown>;
      };
      expect(identify.event).toBe("$identify");
      expect(identify.properties.$anon_distinct_id).toBe(journeyId);
      expect(identify.properties.distinct_id).toBe(userId);
      expect(JSON.stringify(forwarded)).not.toContain("SECRET");
      await dashboard.setConsent("denied");
      window.happyDOM.setURL("https://www.getdesign.app/");
      expect(marketing.allowed()).toBe(false);
    } finally {
      await dashboardSdk.shutdown();
    }
  } finally {
    await posthog.shutdown();
    await window.happyDOM.close();
  }
});
