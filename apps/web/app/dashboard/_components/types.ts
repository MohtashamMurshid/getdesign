import type { DesignStreamEvent } from "@getdesign/sdk";

export type PhaseId =
  | "crawl"
  | "capture"
  | "visual"
  | "describe"
  | "extract"
  | "synthesize"
  | "render";

export type PhaseState = "pending" | "running" | "ok" | "error";

export type DashboardStatus = "idle" | "running" | "done" | "error";

export type DashboardResult = Extract<
  DesignStreamEvent,
  { type: "result" }
>["result"];

/** Server-evaluated credential availability passed to the runner. */
export type DashboardAccess = {
  /** Whether WorkOS auth + Vault are configured for this deployment. */
  workosConfigured: boolean;
  /** Email of the signed-in user, or `null` when signed out / local mode. */
  userEmail: string | null;
  /** Whether the signed-in user has each key stored in WorkOS Vault. */
  stored: { daytona: boolean; openai: boolean };
  /** Whether each key is available via environment variables (local dev). */
  env: { daytona: boolean; openai: boolean };
};
