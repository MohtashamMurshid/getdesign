import { expect, test } from "bun:test";
import { createAnalytics } from "../src/client";
import { config, grantedCookie, harness, userId } from "./helpers";

const click = {
  event: "cta_clicked" as const,
  properties: { cta: "hero_extract" as const },
};
test("no SDK, persistence, identity, or event before consent or with missing config", async () => {
  for (const selected of [config, null]) {
    const h = harness(selected);
    await h.analytics.sync();
    h.analytics.identify(userId);
    expect(h.analytics.capture(click)).toBe(false);
    expect(h.loads()).toBe(0);
    expect(h.cookie()).toBe("");
    expect(h.sent).toHaveLength(0);
  }
  const missing = harness(null);
  await missing.analytics.setConsent("granted");
  expect(missing.cookie()).toBe("");
});

test("explicit consent uses safe SDK controls and withdrawal blocks subsequent events", async () => {
  const h = harness();
  await h.analytics.setConsent("granted");
  expect(h.loads()).toBe(1);
  expect(h.options()).toMatchObject({
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: false,
    disable_session_recording: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    request_batching: false,
    mask_personal_data_properties: true,
    save_referrer: false,
    opt_out_capturing_by_default: true,
    person_profiles: "identified_only",
    cross_subdomain_cookie: false,
  });
  h.analytics.identify(userId);
  h.analytics.identify(userId);
  h.analytics.capture(click);
  expect(h.sent.map((event) => event.event)).toEqual([
    "$identify",
    "cta_clicked",
  ]);
  expect(h.sent[0]).not.toHaveProperty("$set_once");
  expect(h.sent[1].properties).not.toHaveProperty("$current_url");
  await h.analytics.setConsent("denied");
  expect(h.resets()).toBe(1);
  h.analytics.identify(userId);
  expect(h.analytics.capture(click)).toBe(false);
  expect(h.sent).toHaveLength(2);
  await h.analytics.setConsent("granted");
  expect(h.loads()).toBe(1);
});

test("privacy signals override saved consent, including changes in another tab", async () => {
  const h = harness();
  h.setCookie(grantedCookie);
  h.setSignal(true);
  await h.analytics.sync();
  expect(h.loads()).toBe(0);
  h.setSignal(false);
  await h.analytics.sync();
  expect(h.analytics.capture(click)).toBe(true);
  h.setCookie("gd_analytics_consent_v1_development=denied");
  expect(h.analytics.capture(click)).toBe(false);
  await h.analytics.sync();
  expect(h.analytics.ready()).toBe(false);
});

test("withdrawal while SDK loads cannot initialize or replay prior events", async () => {
  const h = harness();
  let resolve!: (value: typeof h.sdk) => void;
  h.port.load = () =>
    new Promise((done) => {
      resolve = done as typeof resolve;
    });
  const analytics = createAnalytics(config, "dashboard", h.port);
  const enabling = analytics.setConsent("granted");
  expect(analytics.capture(click)).toBe(false);
  await analytics.setConsent("denied");
  resolve(h.sdk);
  await enabling;
  expect(h.options()).toEqual({});
  expect(h.sent).toHaveLength(0);
});

test("production shares only native SDK identity and consent across product subdomains", async () => {
  const h = harness({
    ...config,
    environment: "production",
    origins: ["https://www.getdesign.app", "https://dashboard.getdesign.app"],
  });
  await h.analytics.setConsent("granted");
  expect(h.cookie()).toContain("Domain=getdesign.app");
  expect(h.cookie()).toContain("Secure");
  expect(h.options().cross_subdomain_cookie).toBe(true);
  expect(h.options().persistence).toBe("cookie");
});
