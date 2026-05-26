"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { RunState, RunStep, StepStatus } from "@/lib/runs-store";

const RUN_STEPS: Array<{
  id: RunStep;
  label: string;
  detail: string;
}> = [
  {
    id: "crawl",
    label: "Crawl",
    detail: "Fetch HTML and stylesheets from the public URL.",
  },
  {
    id: "capture",
    label: "Capture",
    detail: "Render the page and capture visual tiles when Daytona is available.",
  },
  {
    id: "describe",
    label: "Describe",
    detail: "Turn screenshots into a designer-grade visual walkthrough.",
  },
  {
    id: "extract",
    label: "Extract",
    detail: "Parse deterministic colors, type, spacing, radii, and breakpoints.",
  },
  {
    id: "synthesize",
    label: "Synthesize",
    detail: "Generate the structured design document from visual and CSS facts.",
  },
  {
    id: "render",
    label: "Render",
    detail: "Write the final design.md artifact.",
  },
];

export function RunProgress({ initialRun }: { initialRun: RunState }) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [error, setError] = useState<string | null>(initialRun.error ?? null);
  const [isRunning, setIsRunning] = useState(false);
  const startedRef = useRef(false);

  const completedCount = useMemo(
    () =>
      RUN_STEPS.filter((step) => {
        const status = run.steps[step.id];
        return status === "ok" || status === "skipped";
      }).length,
    [run.steps],
  );
  const progress = Math.round((completedCount / RUN_STEPS.length) * 100);

  const refreshRun = useCallback(async () => {
    const response = await fetch(`/api/runs/${run.id}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as {
      run?: RunState;
      error?: string;
    };

    if (!response.ok || !payload.run) {
      throw new Error(payload.error ?? "Could not load run.");
    }

    setRun(payload.run);
    return payload.run;
  }, [run.id]);

  const runSteps = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      let current = await refreshRun();

      for (const step of RUN_STEPS) {
        const status = current.steps[step.id];
        if (status === "ok" || status === "skipped") continue;
        if (status === "running") {
          current = await refreshRun();
          if (current.steps[step.id] === "ok" || current.steps[step.id] === "skipped") {
            continue;
          }
        }

        const response = await fetch(`/api/runs/${current.id}/${step.id}`, {
          method: "POST",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          run?: RunState;
          error?: string;
        };

        if (!response.ok || !payload.run) {
          throw new Error(payload.error ?? `${step.label} failed.`);
        }

        current = payload.run;
        setRun(current);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed.");
      await refreshRun().catch(() => {});
    } finally {
      setIsRunning(false);
    }
  }, [refreshRun, router]);

  useEffect(() => {
    if (startedRef.current) return;
    if (run.status === "completed" || run.status === "failed") return;

    startedRef.current = true;
    const timer = window.setTimeout(() => {
      void runSteps();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [run.status, runSteps]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div className="border-b pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Generating design.md</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{run.url}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tracking-tight">{progress}%</p>
            <p className="text-xs text-muted-foreground">{run.status}</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {error ?? run.message ?? "Starting run"}
        </p>
      </div>

      <div className="grid gap-3">
        {RUN_STEPS.map((step, index) => (
          <StepRow
            key={step.id}
            index={index + 1}
            label={step.label}
            detail={step.detail}
            status={run.steps[step.id]}
          />
        ))}
      </div>

      {run.status === "failed" || error ? (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error ?? run.error}</p>
          <Button
            size="sm"
            variant="destructive"
            disabled={isRunning}
            onClick={() => void runSteps()}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StepRow({
  index,
  label,
  detail,
  status,
}: {
  index: number;
  label: string;
  detail: string;
  status: StepStatus;
}) {
  return (
    <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border px-4 py-3">
      <div
        className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${stepBadgeClass(status)}`}
      >
        {status === "ok" ? "✓" : status === "skipped" ? "–" : index}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className={`rounded-md px-2 py-1 text-xs ${stepPillClass(status)}`}>
        {status}
      </span>
    </div>
  );
}

function stepBadgeClass(status: StepStatus) {
  if (status === "ok") return "bg-emerald-500 text-white";
  if (status === "skipped") return "bg-amber-500 text-white";
  if (status === "failed") return "bg-destructive text-destructive-foreground";
  if (status === "running") return "bg-foreground text-background";
  return "bg-muted text-muted-foreground";
}

function stepPillClass(status: StepStatus) {
  if (status === "ok") return "bg-emerald-500/10 text-emerald-700";
  if (status === "skipped") return "bg-amber-500/10 text-amber-700";
  if (status === "failed") return "bg-destructive/10 text-destructive";
  if (status === "running") return "bg-foreground/10 text-foreground";
  return "bg-muted text-muted-foreground";
}
