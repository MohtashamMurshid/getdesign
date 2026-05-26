"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { toRunState, type RunState, type RunStep } from "@/lib/runs-store";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { BrowserWindow } from "./browser-window";
import { CaptureStage } from "./stages/capture-stage";
import { CrawlStage } from "./stages/crawl-stage";
import { DescribeStage } from "./stages/describe-stage";
import { ExtractStage } from "./stages/extract-stage";
import { FailedStage } from "./stages/failed-stage";
import { RenderStage } from "./stages/render-stage";
import { Stage } from "./stages/stage-shell";
import { SynthesizeStage } from "./stages/synthesize-stage";
import { useRunArtifacts } from "./use-run-artifacts";

const STEP_ORDER: RunStep[] = [
  "crawl",
  "capture",
  "describe",
  "extract",
  "synthesize",
  "render",
];

const STEP_DAG: Array<RunStep | RunStep[]> = [
  "crawl",
  ["capture", "extract"],
  "describe",
  "synthesize",
  "render",
];

type Phase =
  | "crawl"
  | "capture"
  | "describe"
  | "extract"
  | "synthesize"
  | "render"
  | "completed"
  | "failed";

export function RunProgress({
  initialRun,
  userId,
}: {
  initialRun: RunState;
  userId: string;
}) {
  const router = useRouter();
  const liveRun = useQuery(api.designRuns.get, {
    id: initialRun.id as Id<"designRuns">,
    userId,
  });
  const run = liveRun ? toRunState(liveRun) : initialRun;
  const runError =
    typeof run.error === "object" && run.error ? run.error.message : run.error;
  const [error, setError] = useState<string | null>(runError ?? null);
  const [isRunning, setIsRunning] = useState(false);
  const startedRef = useRef(false);

  const artifacts = useRunArtifacts(run, userId);

  const completedCount = useMemo(
    () =>
      STEP_ORDER.filter((step) => {
        const status = run.steps[step];
        return status === "ok" || status === "skipped";
      }).length,
    [run.steps],
  );
  const progress = Math.round((completedCount / STEP_ORDER.length) * 100);

  const runSteps = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      for (const group of STEP_DAG) {
        if (Array.isArray(group)) {
          await Promise.all(group.map((step) => postStep(run.id, step)));
        } else {
          await postStep(run.id, group);
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setIsRunning(false);
    }
  }, [router, run.id]);

  useEffect(() => {
    if (startedRef.current) return;
    if (run.status === "completed" || run.status === "failed") return;

    startedRef.current = true;
    void runSteps();
  }, [run.status, runSteps]);

  const phase = derivePhase(run, error);
  useEffect(() => {
    setError(runError ?? null);
  }, [runError]);

  const substatus = useMemo(() => {
    if (phase === "failed") return "Failed";
    if (phase === "completed") return "Done";
    return run.message ?? "Starting…";
  }, [phase, run.message]);

  const onRetry = useCallback(() => void runSteps(), [runSteps]);
  const onOpen = useCallback(() => router.refresh(), [router]);

  const siteCaption = run.siteName ?? safeHostname(run.url);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-3 p-6">
      <BrowserWindow
        url={run.url}
        substatus={substatus}
        tone={phase === "failed" ? "error" : "default"}
      >
        <Stage active={phase === "crawl"}>
          <CrawlStage crawl={artifacts.crawl} />
        </Stage>
        <Stage active={phase === "capture"}>
          <CaptureStage
            runId={run.id}
            visual={artifacts.visual}
            expectedTiles={run.tiles}
          />
        </Stage>
        <Stage active={phase === "describe"}>
          <DescribeStage
            runId={run.id}
            description={artifacts.description}
            visual={artifacts.visual}
          />
        </Stage>
        <Stage active={phase === "extract"}>
          <ExtractStage tokens={artifacts.tokens} />
        </Stage>
        <Stage active={phase === "synthesize"}>
          <SynthesizeStage doc={artifacts.doc} tokens={artifacts.tokens} />
        </Stage>
        <Stage active={phase === "render" || phase === "completed"}>
          <RenderStage
            doc={artifacts.doc}
            isComplete={phase === "completed"}
            onOpen={onOpen}
          />
        </Stage>
        <Stage active={phase === "failed"}>
          <FailedStage
            error={error ?? runError ?? "Run failed."}
            onRetry={onRetry}
            isRetrying={isRunning}
          />
        </Stage>
      </BrowserWindow>

      <p className="font-mono text-[11px] text-muted-foreground">
        {siteCaption} · {progress}%
      </p>
    </div>
  );
}

async function postStep(runId: string, step: RunStep) {
  const response = await fetch(`/api/runs/${runId}/${step}`, {
    method: "POST",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? `${step} failed.`);
  }
}

function derivePhase(run: RunState, error: string | null): Phase {
  if (error || run.status === "failed") return "failed";
  if (run.status === "completed") return "completed";

  // Walk steps in order, find the first one not yet ok/skipped.
  for (const step of STEP_ORDER) {
    const status = run.steps[step];
    if (status === "ok" || status === "skipped") continue;
    return step;
  }
  return "completed";
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
