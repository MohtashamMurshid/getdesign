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
