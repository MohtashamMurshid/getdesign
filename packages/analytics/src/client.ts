import type { PostHog, PostHogConfig } from "posthog-js";
import {
  consentCookieName,
  consentFromCookie,
  readConfig,
  type AnalyticsConfig,
} from "./config";
import {
  allowlistedProperties,
  isUserId,
  sanitizeEvent,
  type ProductEvent,
  type Surface,
} from "./schema";

export type Consent = "granted" | "denied" | "unknown";
type Sdk = Pick<
  PostHog,
  | "init"
  | "capture"
  | "identify"
  | "get_distinct_id"
  | "opt_in_capturing"
  | "opt_out_capturing"
  | "reset"
>;
export type BrowserPort = {
  cookie: () => string;
  writeCookie: (value: string) => void;
  privacySignal: () => boolean;
  load: () => Promise<Sdk>;
};

export function sdkConfig(
  config: AnalyticsConfig,
  surface: Surface,
  allowed: () => boolean,
): Partial<PostHogConfig> {
  let instance: Pick<PostHog, "unregister"> | undefined;
  const clearAttribution = () => {
    for (const key of [
      "$client_session_props",
      "$initial_person_info",
      "$initial_referrer_info",
      "$initial_campaign_params",
      "$search_keyword",
    ])
      instance?.unregister(key);
  };
  return {
    loaded: (client) => {
      instance = client;
      clearAttribution();
    },
    api_host: "/api/analytics",
    defaults: "2026-05-30",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_performance: false,
    capture_heatmaps: false,
    rageclick: false,
    disable_session_recording: true,
    enable_recording_console_log: false,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    advanced_disable_feature_flags: true,
    advanced_disable_toolbar_metrics: true,
    logs: { captureConsoleLogs: false },
    opt_in_site_apps: false,
    opt_out_capturing_by_default: true,
    opt_out_persistence_by_default: true,
    opt_out_capturing_persistence_type: "cookie",
    persistence: "cookie",
    persistence_name: `gd_posthog_v1_${config.environment}`,
    cross_subdomain_cookie: config.environment === "production",
    secure_cookie: config.environment !== "development",
    cookie_expiration: 180,
    split_storage: false,
    persistence_save_debounce_ms: 0,
    person_profiles: "identified_only",
    save_referrer: false,
    save_campaign_params: false,
    store_google: false,
    custom_campaign_params: [],
    mask_personal_data_properties: true,
    get_current_url: () => "",
    disable_capture_url_hashes: true,
    ip: false,
    respect_dnt: true,
    debug: false,
    internal_or_test_user_hostname: null,
    // The same-origin relay rechecks consent before forwarding, including retries.
    api_transport: "fetch",
    request_batching: false,
    disable_compression: true,
    on_request_error: () => {},
    before_send: (event) => {
      // The SDK persists session attribution independently of save_referrer.
      // Remove those records with its public API before any request is sent.
      clearAttribution();
      if (!event || !allowed()) return null;
      const clean = sanitizeEvent(event, surface, config.environment);
      if (!clean) return null;
      const digest = event.properties.$insert_id;
      const uuid =
        typeof digest === "string"
          ? `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`
          : event.uuid;
      return {
        ...clean,
        uuid,
        timestamp: event.timestamp,
        properties: { ...clean.properties, token: config.token },
      };
    },
  };
}

export function createAnalytics(
  config: AnalyticsConfig | null,
  surface: Surface,
  browser: BrowserPort,
) {
  let sdk: Sdk | undefined;
  let loading: Promise<void> | undefined;
  let active = false;
  const seen = new Set<string>();
  const listeners = new Set<() => void>();
  const consent = (): Consent =>
    config ? consentFromCookie(browser.cookie(), config) : "unknown";
  const allowed = () =>
    !!config && consent() === "granted" && !browser.privacySignal();
  const publish = () => listeners.forEach((listener) => listener());
  const sync = async () => {
    if (!allowed()) {
      if (sdk && active) {
        sdk.reset(true);
        sdk.opt_out_capturing();
        active = false;
      }
      publish();
      return;
    }
    if (sdk) {
      sdk.opt_in_capturing({ captureEventName: false });
      active = true;
      publish();
      return;
    }
    if (loading) return loading;
    loading = (async () => {
      try {
        const loaded = await browser.load();
        if (!allowed() || !config) return;
        loaded.init(config.token, sdkConfig(config, surface, allowed));
        sdk = loaded;
        if (allowed()) {
          sdk.opt_in_capturing({ captureEventName: false });
          active = true;
        } else sdk.opt_out_capturing();
      } catch {
        /* Analytics must never interrupt authentication, runs, or downloads. */
      } finally {
        loading = undefined;
        publish();
      }
    })();
    return loading;
  };
  const capture = (input: ProductEvent): boolean => {
    if (!allowed() || !sdk) return false;
    const properties = allowlistedProperties(input.event, input.properties);
    if (!properties) return false;
    const key = properties.$insert_id;
    if (key && seen.has(key)) return false;
    try {
      if (!sdk.capture(input.event, properties)) return false;
      if (key) seen.add(key);
      return true;
    } catch {
      return false;
    }
  };
  return {
    configured: !!config,
    consent,
    allowed,
    ready: () => allowed() && !!sdk,
    sync,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async setConsent(value: "granted" | "denied") {
      if (!config) return;
      const domain =
        config.environment === "production" ? "; Domain=getdesign.app" : "";
      const secure = config.environment === "development" ? "" : "; Secure";
      browser.writeCookie(
        `${consentCookieName(config)}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${domain}${secure}`,
      );
      // Deleting persistence on opt-out also discards the old anonymous/account ID.
      if (value === "denied") {
        sdk?.reset(true);
        sdk?.opt_out_capturing();
        active = false;
        seen.clear();
      }
      await sync();
    },
    identify(userId: string) {
      if (!allowed() || !sdk || !isUserId(userId)) return;
      try {
        const previous = sdk.get_distinct_id();
        if (previous === userId) return;
        if (isUserId(previous)) {
          sdk.reset(true);
          sdk.opt_in_capturing({ captureEventName: false });
        }
        sdk.identify(userId);
      } catch {
        /* No user properties or auth data are passed to the SDK. */
      }
    },
    reset() {
      try {
        sdk?.reset(true);
      } catch {
        /* Keep sign-out independent of analytics. */
      }
      active = false;
      seen.clear();
    },
    capture,
  };
}

export type Analytics = ReturnType<typeof createAnalytics>;
let singleton: Analytics | undefined;
export function getAnalytics(surface?: Surface): Analytics {
  if (singleton) return singleton;
  const browser = typeof window !== "undefined";
  const config = browser
    ? readConfig(process.env.NEXT_PUBLIC_POSTHOG_CONFIG, window.location.origin)
    : null;
  const port: BrowserPort = {
    cookie: () => {
      try {
        return browser ? document.cookie : "";
      } catch {
        return "";
      }
    },
    writeCookie: (value) => {
      try {
        if (browser) document.cookie = value;
      } catch {
        /* Consent remains off when storage is blocked. */
      }
    },
    privacySignal: () =>
      !browser ||
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true,
    load: async () => (await import("posthog-js")).default,
  };
  const result = createAnalytics(config, surface ?? "dashboard", port);
  if (browser) singleton = result;
  return result;
}

export async function eventDigest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
