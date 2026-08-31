export type Surface = "marketing" | "dashboard";
export type Cta =
  | "nav_get_started"
  | "hero_extract"
  | "footer_dashboard"
  | "final_extract"
  | "dashboard_start";
export type RunMode = "visual" | "text_only";
export type Step =
  | "crawl"
  | "capture"
  | "extract"
  | "describe"
  | "synthesize"
  | "render";
export type ProductEvent =
  | { event: "cta_clicked"; properties: { cta: Cta } }
  | { event: "signup_completed"; properties: { $insert_id: string } }
  | {
      event: "run_started" | "run_completed";
      properties: { mode: RunMode; $insert_id: string };
    }
  | {
      event: "run_failed";
      properties: { mode: RunMode; step: Step; $insert_id: string };
    }
  | { event: "design_md_downloaded"; properties: Record<string, never> };

const ctas = [
  "nav_get_started",
  "hero_extract",
  "footer_dashboard",
  "final_extract",
  "dashboard_start",
];
const steps = [
  "crawl",
  "capture",
  "extract",
  "describe",
  "synthesize",
  "render",
];
export const isUserId = (value: unknown): value is string =>
  typeof value === "string" && /^user_[A-Z0-9]{26}$/.test(value);
const isAnonymousId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const isInsertId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

/** Rebuild, never spread, properties at the final SDK boundary. Unknown events fail closed. */
export function allowlistedProperties(
  event: string,
  input: Record<string, unknown>,
): Record<string, string> | null {
  switch (event) {
    case "cta_clicked":
      return ctas.includes(input.cta as string)
        ? { cta: input.cta as string }
        : null;
    case "signup_completed":
      return isInsertId(input.$insert_id)
        ? { $insert_id: input.$insert_id }
        : null;
    case "run_started":
    case "run_completed":
    case "run_failed": {
      if (
        !isInsertId(input.$insert_id) ||
        !["visual", "text_only"].includes(input.mode as string)
      )
        return null;
      const result: Record<string, string> = {
        mode: input.mode as string,
        $insert_id: input.$insert_id,
      };
      if (event === "run_failed") {
        if (!steps.includes(input.step as string)) return null;
        result.step = input.step as string;
      }
      return result;
    }
    case "design_md_downloaded":
      return {};
    case "$identify":
      return isUserId(input.distinct_id) &&
        isAnonymousId(input.$anon_distinct_id)
        ? { $anon_distinct_id: input.$anon_distinct_id }
        : null;
    default:
      return null;
  }
}

export function sanitizeEvent(
  event: { event: string; properties: Record<string, unknown> },
  surface: Surface,
  environment: string,
): {
  event: string;
  properties: Record<string, string | number | boolean>;
} | null {
  const properties = allowlistedProperties(event.event, event.properties);
  const distinctId = event.properties.distinct_id;
  if (!properties || (!isUserId(distinctId) && !isAnonymousId(distinctId)))
    return null;
  return {
    event: event.event,
    properties: {
      ...properties,
      distinct_id: distinctId,
      surface,
      environment,
      schema_version: 1,
      $geoip_disable: true,
      $process_person_profile: isUserId(distinctId),
    },
  };
}
