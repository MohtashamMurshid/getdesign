"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import { InputBar } from "@/components/agent-elements/input-bar";
import { BrandMark } from "@/components/brand-mark";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type AgentCommandProps = {
  aiReady: boolean;
  user: {
    id: string;
    email?: string;
  };
};

type RunStep =
  | "crawl"
  | "capture"
  | "describe"
  | "extract"
  | "synthesize"
  | "render";

type StepStatus = "pending" | "running" | "ok" | "skipped" | "failed";

type RunState = {
  id: Id<"designRuns">;
  status: "queued" | "running" | "completed" | "failed";
  message?: string;
  steps: Record<RunStep, StepStatus>;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isProbablyUrl(value: string) {
  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function AgentCommand({ aiReady, user }: AgentCommandProps) {
  const router = useRouter();
  const createRun = useMutation(api.designRuns.create);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-xl flex-col justify-center px-4 py-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark size={34} />
        <p className="mt-4 text-lg font-medium tracking-tight text-foreground">
          What are we designing today?
        </p>
      </div>

      <InputBar
        size="lg"
        className="px-0 pb-0"
        status={isPending || isRunning ? "submitted" : "ready"}
        disabled={!aiReady || isRunning}
        placeholder={aiReady ? "Enter a URL..." : "Server AI key not configured"}
        onStop={() => {}}
        onSend={({ content }) => {
          setError(null);
          setRun(null);
          if (!isProbablyUrl(content)) {
            setError("Enter a public URL.");
            return;
          }

          startTransition(async () => {
            setIsRunning(true);
            try {
              const runId = await createRun({
                url: normalizeUrl(content),
                userId: user.id,
                userEmail: user.email,
              });
              setRun({
                id: runId,
                status: "queued",
                message: "Queued",
                steps: {
                  crawl: "pending",
                  capture: "pending",
                  describe: "pending",
                  extract: "pending",
                  synthesize: "pending",
                  render: "pending",
                },
              });
              router.push(`/runs/${runId}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not start run.");
            } finally {
              setIsRunning(false);
            }
          });
        }}
        infoBar={
          !aiReady
            ? {
                title: "Setup needed.",
                description:
                  "This deployment needs an AI key. For local CLI/SDK/API runs, see BYOK docs.",
                action: {
                  label: "API docs",
                  onClick: () => router.push("/api"),
                },
              }
            : undefined
        }
      />

      {error ? <p className="mt-2 text-center text-xs text-destructive">{error}</p> : null}
      {run ? <RunProgress run={run} /> : null}
    </div>
  );
}

function RunProgress({ run }: { run: RunState }) {
  return (
    <div className="mt-5 rounded-lg border bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs font-medium">{run.message ?? "Running"}</p>
        <p className="shrink-0 text-xs text-muted-foreground">{run.status}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Opening the run page...
      </p>
    </div>
  );
}
