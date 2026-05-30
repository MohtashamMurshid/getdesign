"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import type { RunState, RunStep, StepStatus, StoredVisual } from "@/lib/runs-store";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export type RunArtifacts = {
  crawl: CrawlSiteResult | null;
  visual: StoredVisual | null;
  description: string | null;
  tokens: DesignTokens | null;
  doc: DesignDoc | null;
};

const SHOULD_FETCH_AFTER: Record<keyof RunArtifacts, RunStep> = {
  crawl: "crawl",
  visual: "capture",
  description: "describe",
  tokens: "extract",
  doc: "synthesize",
};

function shouldFetch(run: RunState, key: keyof RunArtifacts): boolean {
  const step = SHOULD_FETCH_AFTER[key];
  const status = run.steps[step];
  if (status === "ok") return true;
  if (status === "running") return true;
  return false;
}

export function useRunArtifacts(run: RunState, userId: string): RunArtifacts {
  const convexArtifacts = useQuery(api.designRunArtifacts.getForRun, {
    runId: run.id as Id<"designRuns">,
    userId,
  }) as (RunArtifacts & { markdown?: string | null }) | undefined;
  const tileUrls = useQuery(api.designRunArtifacts.getTileUrls, {
    runId: run.id as Id<"designRuns">,
    userId,
  });
  const [artifacts, setArtifacts] = useState<RunArtifacts>({
    crawl: null,
    visual: null,
    description: null,
    tokens: null,
    doc: null,
  });

  // Track fetch generation per key so we only refetch when status changes from
  // a "should not fetch" state to a "should fetch" state, plus periodic
  // refresh while the step is still running (to pick up evolving artifacts
  // like description.md as it gets written).
  const inflightRef = useRef<Partial<Record<keyof RunArtifacts, AbortController>>>({});
  const fetchedRef = useRef<Partial<Record<keyof RunArtifacts, StepStatus>>>({});

  useEffect(() => {
    (Object.keys(SHOULD_FETCH_AFTER) as Array<keyof RunArtifacts>).forEach((key) => {
      const step = SHOULD_FETCH_AFTER[key];
      const status = run.steps[step];

      if (!shouldFetch(run, key)) return;

      const lastFetched = fetchedRef.current[key];
      const isRunning = status === "running";
      const becameOk = status === "ok" && lastFetched !== "ok";
      const firstRunning = isRunning && lastFetched !== "running" && lastFetched !== "ok";

      if (!becameOk && !firstRunning && !isRunning) return;
      if (isRunning && lastFetched === "running" && artifacts[key] !== null) {
        // Allow a single periodic refetch while running; gated by status flips.
        return;
      }

      fetchedRef.current[key] = status;
      const value = convexArtifacts?.[key] ?? null;
      if (value !== null) {
        setArtifacts((prev) => ({ ...prev, [key]: value }));
      }
    });
    // We re-run whenever the step statuses change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    run.id,
    convexArtifacts,
    run.steps.crawl,
    run.steps.capture,
    run.steps.describe,
    run.steps.extract,
    run.steps.synthesize,
    run.steps.render,
    run.updatedAt,
  ]);

  if (artifacts.visual && tileUrls) {
    return {
      ...artifacts,
      visual: {
        ...artifacts.visual,
        tiles: artifacts.visual.tiles.map((tile, index) => ({
          ...tile,
          url: tileUrls[index]?.url ?? tile.url,
        })),
      },
    };
  }

  return artifacts;
}

export function tileUrl(visual: StoredVisual | null, index: number): string | null {
  return visual?.tiles[index]?.url ?? null;
}
