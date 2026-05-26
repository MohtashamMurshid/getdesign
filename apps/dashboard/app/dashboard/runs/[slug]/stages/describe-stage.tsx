"use client";

import { useEffect, useState } from "react";

import type { StoredVisual } from "@/lib/runs-store";

import { tileUrl } from "../use-run-artifacts";

const MAX_VISIBLE_CHARS = 1400;

export function DescribeStage({
  runId,
  description,
  visual,
}: {
  runId: string;
  description: string | null;
  visual: StoredVisual | null;
}) {
  const slice = (description ?? "").slice(0, MAX_VISIBLE_CHARS);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!slice) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = Math.min(i + 8, slice.length);
      setShown(i);
      if (i >= slice.length) window.clearInterval(interval);
    }, 22);
    return () => window.clearInterval(interval);
  }, [slice]);

  const tileCount = visual?.tiles?.length ?? 0;
  const backdropTile = tileCount > 0 ? tileUrl(visual, 0) : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {backdropTile ? (
        <img
          src={backdropTile}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover object-top opacity-15 blur-sm"
        />
      ) : (
        <div className="absolute inset-0 bg-muted/40" />
      )}
      <div className="absolute inset-0 bg-background/55" />

      <div className="relative flex h-full items-center justify-center p-8">
        <div className="w-full max-w-2xl rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Visual walkthrough
          </p>
          <pre className="mt-3 max-h-[60%] overflow-hidden whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground/90">
            {slice.slice(0, shown)}
            <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-foreground/70 align-middle" />
          </pre>
        </div>
      </div>
    </div>
  );
}
