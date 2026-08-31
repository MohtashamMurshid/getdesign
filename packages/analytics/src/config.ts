export type Environment = "production" | "preview" | "development";
export type AnalyticsConfig = {
  token: string;
  host: string;
  environment: Environment;
  origins: string[];
};

const environments = ["production", "preview", "development"];
const hosts = ["https://us.i.posthog.com", "https://eu.i.posthog.com"];
const productionOrigins = [
  "https://www.getdesign.app",
  "https://getdesign.app",
  "https://dashboard.getdesign.app",
];

/** Called at build time. Vercel's environment always overrides manual deployment labels. */
export function buildAnalyticsConfig(
  env: Record<string, string | undefined>,
): string {
  const deployment =
    env.VERCEL_ENV ??
    (env.NODE_ENV === "development"
      ? "development"
      : env.POSTHOG_DEPLOYMENT_ENV);
  if (env.POSTHOG_ENABLED !== "true" || env.POSTHOG_PROJECT_ENV !== deployment)
    return "null";
  const config = validateConfig({
    environment: deployment,
    token: env.POSTHOG_PROJECT_TOKEN,
    host: env.POSTHOG_HOST,
    origins: env.POSTHOG_ALLOWED_ORIGINS?.split(",").map((value) =>
      value.trim(),
    ),
  });
  return JSON.stringify(config);
}

export function validateConfig(value: unknown): AnalyticsConfig | null {
  if (!value || typeof value !== "object") return null;
  const { token, host, environment, origins } =
    value as Partial<AnalyticsConfig>;
  if (
    typeof token !== "string" ||
    !/^phc_[A-Za-z0-9]{20,}$/.test(token) ||
    !hosts.includes(host ?? "") ||
    !environments.includes(environment ?? "") ||
    !Array.isArray(origins) ||
    origins.length === 0
  )
    return null;
  const valid = origins.every((origin) => {
    if (typeof origin !== "string") return false;
    try {
      const url = new URL(origin);
      if (url.origin !== origin || url.username || url.password) return false;
      if (environment === "production")
        return productionOrigins.includes(origin);
      if (
        productionOrigins.includes(origin) ||
        url.hostname.endsWith(".getdesign.app")
      )
        return false;
      if (environment === "development")
        return ["localhost", "127.0.0.1"].includes(url.hostname);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  });
  return valid
    ? { token, host: host!, environment: environment!, origins }
    : null;
}

export function readConfig(
  serialized: string | undefined,
  origin: string,
): AnalyticsConfig | null {
  try {
    const config = validateConfig(JSON.parse(serialized ?? "null"));
    return config?.origins.includes(origin) ? config : null;
  } catch {
    return null;
  }
}

export function consentCookieName(config: AnalyticsConfig): string {
  return `gd_analytics_consent_v1_${config.environment}`;
}

export function consentFromCookie(
  cookie: string,
  config: AnalyticsConfig,
): "granted" | "denied" | "unknown" {
  const values = cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${consentCookieName(config)}=`))
    .map((part) => part.split("=")[1]);
  if (values.includes("denied")) return "denied";
  return values.length === 1 && values[0] === "granted" ? "granted" : "unknown";
}
