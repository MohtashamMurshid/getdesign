import { createAnalytics, type BrowserPort } from "../src/client";
import type { AnalyticsConfig } from "../src/config";
import type { CaptureResult, PostHogConfig } from "posthog-js";

// Inert test token. All tests inject transport; never use a real project.
export const config: AnalyticsConfig = {
  token: `phc_${"0".repeat(32)}`,
  host: "https://eu.i.posthog.com",
  environment: "development",
  origins: ["http://localhost:3014"],
};
export const anonymousId = "01234567-89ab-4cde-8123-456789abcdef";
export const userId = "user_01ARZ3NDEKTSV4RRFFQ69G5FAV";
export const grantedCookie = "gd_analytics_consent_v1_development=granted";
export function harness(selected: AnalyticsConfig | null = config) {
  const sent: CaptureResult[] = [];
  let cookie = "";
  let currentId = anonymousId;
  let optedIn = false;
  let options: Partial<PostHogConfig> = {};
  let loads = 0;
  let signal = false;
  let resets = 0;
  const sdk = {
    init(_token: string, value: Partial<PostHogConfig>) {
      options = value;
    },
    capture(event: string, properties: Record<string, unknown>) {
      if (!optedIn) return;
      const input = {
        event,
        uuid: anonymousId,
        properties: {
          ...properties,
          distinct_id: currentId,
          $current_url: "https://secret.test/?key=SECRET",
          $set: { email: "secret@example.test" },
        },
        $set_once: { password: "SECRET" },
      };
      const before = options.before_send;
      const result = typeof before === "function" ? before(input) : input;
      if (result) sent.push(result);
      return result;
    },
    identify(id: string) {
      const old = currentId;
      currentId = id;
      this.capture("$identify", { $anon_distinct_id: old });
    },
    get_distinct_id: () => currentId,
    opt_in_capturing() {
      optedIn = true;
    },
    opt_out_capturing() {
      optedIn = false;
    },
    reset() {
      currentId = anonymousId;
      resets++;
      optedIn = false;
    },
  };
  const port: BrowserPort = {
    cookie: () => cookie,
    writeCookie: (value) => {
      cookie = value;
    },
    privacySignal: () => signal,
    load: async () => {
      loads++;
      return sdk as unknown as Awaited<ReturnType<BrowserPort["load"]>>;
    },
  };
  const analytics = createAnalytics(selected, "dashboard", port);
  return {
    analytics,
    port,
    sent,
    sdk,
    options: () => options,
    loads: () => loads,
    resets: () => resets,
    cookie: () => cookie,
    setCookie: (value: string) => {
      cookie = value;
    },
    setSignal: (value: boolean) => {
      signal = value;
    },
  };
}
