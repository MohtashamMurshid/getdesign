import type { Id } from "@convex/_generated/dataModel";

export type RunStep =
  | "crawl"
  | "capture"
  | "describe"
  | "extract"
  | "synthesize"
  | "render";

export type StepStatus = "pending" | "running" | "ok" | "skipped" | "failed";

export type RunState = {
  _id?: Id<"designRuns">;
  id: string;
  url: string;
  siteName?: string;
  userId: string;
  userEmail?: string;
  status: "queued" | "running" | "completed" | "failed";
  currentStep?: RunStep;
  message?: string;
  error?: string | { code?: string; message: string; step?: string };
  steps: Record<RunStep, StepStatus>;
  mode?: "visual" | "text_only";
  tiles?: number;
  markdownLength?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type StoredVisual = {
  status: "captured" | "skipped" | "failed";
  reason?: string;
  attempts?: number;
  tiles: Array<{
    file: string;
    width: number;
    height: number;
    format: "png";
    url?: string;
  }>;
  documentHeight?: number;
  documentWidth?: number;
  viewport?: { width: number; height: number };
  measurementMode?: string;
  installedI18nFonts?: boolean;
  durationsMs?: unknown;
};

export function toRunState(run: Omit<RunState, "id"> & { id?: string }): RunState {
  return {
    ...run,
    id: run.id ?? String(run._id),
  };
}

export function runErrorMessage(
  error: RunState["error"] | null | undefined,
): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  return error.message;
}
