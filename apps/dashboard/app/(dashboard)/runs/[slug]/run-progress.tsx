"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "convex/react";

import { toRunState, type RunState, type RunStep } from "@/lib/runs-store";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { StageStrip } from "./stage-strip";
import { CaptureStage } from "./stages/capture-stage";
import { CrawlStage } from "./stages/crawl-stage";
import { DescribeStage } from "./stages/describe-stage";
import { ExtractStage } from "./stages/extract-stage";
import { FailedStage } from "./stages/failed-stage";
import { KickoffStage } from "./stages/kickoff-stage";
import { RenderStage } from "./stages/render-stage";
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

export type Phase =
  | "kickoff"
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
  onActiveTileChange,
}: {
  initialRun: RunState;
  userId: string;
  /**
   * Called by stages that focus a particular tile (e.g. Describe). Index
   * is `-1` when no tile should be highlighted. Used by the surrounding
   * shell to highlight that tile in the hero gallery.
   */
  onActiveTileChange?: (index: number) => void;
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
    // runSteps mutates state inside; intentional kickoff side-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSteps();
  }, [run.status, runSteps]);

  const phase = derivePhase(run, error);

  useEffect(() => {
    // Mirror the convex-derived error into local state so transient client
    // errors and persisted ones share a single render path.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(runError ?? null);
  }, [runError]);

  const onRetry = useCallback(() => void runSteps(), [runSteps]);
  const onOpen = useCallback(() => router.refresh(), [router]);

  const siteCaption = run.siteName ?? safeHostname(run.url);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
      <StageStrip phase={phase} />

      <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {phase === "kickoff" ? (
                <KickoffStage url={run.url} siteName={run.siteName} />
              ) : null}
              {phase === "crawl" ? (
                <CrawlStage crawl={artifacts.crawl} />
              ) : null}
              {phase === "capture" ? (
                <CaptureStage
                  visual={artifacts.visual}
                  expectedTiles={run.tiles}
                />
              ) : null}
              {phase === "extract" ? (
                <ExtractStage tokens={artifacts.tokens} />
              ) : null}
              {phase === "describe" ? (
                <DescribeStage
                  description={artifacts.description}
                  visual={artifacts.visual}
                  onActiveTileChange={onActiveTileChange}
                />
              ) : null}
              {phase === "synthesize" ? (
                <SynthesizeStage
                  doc={artifacts.doc}
                  tokens={artifacts.tokens}
                  visual={artifacts.visual}
                />
              ) : null}
              {phase === "render" || phase === "completed" ? (
                <RenderStage
                  doc={artifacts.doc}
                  isComplete={phase === "completed"}
                  onOpen={onOpen}
                />
              ) : null}
              {phase === "failed" ? (
                <FailedStage
                  error={error ?? runError ?? "Run failed."}
                  onRetry={onRetry}
                  isRetrying={isRunning}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

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

  if (run.status === "queued") return "kickoff";
  if (run.steps.crawl === "pending") return "kickoff";

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
