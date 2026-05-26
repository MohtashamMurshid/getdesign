"use client";

import { useEffect, useRef, useState } from "react";

import type { CrawlSiteResult } from "@getdesign/tools";
import type { DesignDoc, DesignTokens } from "@getdesign/types";

import type { RunState, RunStep, StepStatus, StoredVisual } from "@/lib/runs-store";

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

const ARTIFACT_FILE: Record<keyof RunArtifacts, string> = {
  crawl: "crawl.json",
  visual: "visual.json",
  description: "description.md",
  tokens: "tokens.json",
  doc: "doc.json",
};

function shouldFetch(run: RunState, key: keyof RunArtifacts): boolean {
  const step = SHOULD_FETCH_AFTER[key];
  const status = run.steps[step];
  if (status === "ok") return true;
  if (status === "running") return true;
  return false;
}

function isJson(file: string) {
  return file.endsWith(".json");
}

async function fetchArtifact<T>(runId: string, file: string): Promise<T | null> {
  const response = await fetch(
    `/api/runs/${runId}/artifacts/${file}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  if (isJson(file)) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export function useRunArtifacts(run: RunState): RunArtifacts {
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
    let cancelled = false;

    (Object.keys(ARTIFACT_FILE) as Array<keyof RunArtifacts>).forEach((key) => {
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

      const existing = inflightRef.current[key];
      if (existing) existing.abort();
      const controller = new AbortController();
      inflightRef.current[key] = controller;

      const file = ARTIFACT_FILE[key];
      fetchArtifact(run.id, file)
        .then((value) => {
          if (cancelled || controller.signal.aborted) return;
          fetchedRef.current[key] = status;
          if (value !== null) {
            setArtifacts((prev) => ({ ...prev, [key]: value }));
          }
        })
        .catch(() => {
          if (cancelled) return;
        });
    });

    return () => {
      cancelled = true;
    };
    // We re-run whenever the step statuses change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    run.id,
    run.steps.crawl,
    run.steps.capture,
    run.steps.describe,
    run.steps.extract,
    run.steps.synthesize,
    run.steps.render,
    run.updatedAt,
  ]);

  return artifacts;
}

export function tileUrl(runId: string, index: number): string {
  const padded = String(index).padStart(3, "0");
  return `/api/runs/${runId}/artifacts/tiles/${padded}.png`;
}
