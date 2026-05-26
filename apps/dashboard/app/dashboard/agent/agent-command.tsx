"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { InputBar } from "@/components/agent-elements/input-bar";
import { BrandMark } from "@/components/brand-mark";

type AgentCommandProps = {
  aiReady: boolean;
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
  id: string;
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

export function AgentCommand({ aiReady }: AgentCommandProps) {
  const router = useRouter();
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
        placeholder={aiReady ? "Enter a URL..." : "Add an AI key to start"}
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
              const created = await postJson<{ run: RunState }>("/api/runs", {
                url: normalizeUrl(content),
              });
              setRun(created.run);
              router.push(`/dashboard/runs/${created.run.id}`);
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
                description: "Add an AI key in Settings.",
                action: {
                  label: "Settings",
                  onClick: () => router.push("/dashboard/account"),
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

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload as T;
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
