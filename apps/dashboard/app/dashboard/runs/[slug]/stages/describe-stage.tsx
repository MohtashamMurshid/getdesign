"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { StoredVisual } from "@/lib/runs-store";

const MAX_VISIBLE_CHARS_PER_TILE = 1200;

export function DescribeStage({
  description,
  visual,
  onActiveTileChange,
}: {
  description: string | null;
  visual: StoredVisual | null;
  onActiveTileChange?: (index: number) => void;
}) {
  const segments = useMemo(
    () => splitDescription(description, visual?.tiles?.length ?? 0),
    [description, visual?.tiles?.length],
  );

  const totalSegments = Math.max(segments.length, 1);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    onActiveTileChange?.(activeIndex);
  }, [activeIndex, onActiveTileChange]);

  // Clear the highlight when the stage unmounts.
  useEffect(() => {
    return () => onActiveTileChange?.(-1);
  }, [onActiveTileChange]);

  // Cycle through tiles every ~3.5s so the rail highlight + center card sync.
  useEffect(() => {
    if (totalSegments <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % totalSegments);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [totalSegments]);

  const slice = (segments[activeIndex] ?? "").slice(0, MAX_VISIBLE_CHARS_PER_TILE);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Intentional: typewriter resets to 0 when the active slice changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(0);
    if (!slice) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = Math.min(i + 6, slice.length);
      setShown(i);
      if (i >= slice.length) window.clearInterval(interval);
    }, 18);
    return () => window.clearInterval(interval);
  }, [slice]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/15">
      <div className="flex items-center gap-2 px-6 pt-6">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Reading the design
        </p>
        <span className="ml-auto rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          tile {activeIndex + 1} / {totalSegments}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-2xl rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Tile {activeIndex + 1}
            </p>
            <pre className="mt-3 max-h-[60vh] overflow-hidden whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground/90">
              {slice.length === 0 ? (
                <span className="text-muted-foreground">analyzing…</span>
              ) : (
                <>
                  {slice.slice(0, shown)}
                  <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-foreground/70 align-middle" />
                </>
              )}
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Best-effort split of the description markdown into per-tile chunks. The
 * describer typically writes a section per tile (often with `## Tile N` or
 * similar headings); when that's not detectable we fall back to even slicing.
 */
function splitDescription(description: string | null, tileCount: number): string[] {
  if (!description) return [];
  const trimmed = description.trim();
  if (!trimmed) return [];

  // Try splitting on markdown headings that look tile-y.
  const headingRe = /^\s{0,3}#{1,6}\s+(?:Tile|Section|Panel|Page)\b.*$/gim;
  if (headingRe.test(trimmed)) {
    const parts = trimmed.split(/^\s{0,3}#{1,6}\s+(?:Tile|Section|Panel|Page)\b.*$/gim);
    const cleaned = parts.map((p) => p.trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }

  // Fall back to splitting on the first hash-heading pattern.
  const sections = trimmed.split(/(?=^\s{0,3}#{1,6}\s+)/m).map((s) => s.trim()).filter(Boolean);
  if (sections.length > 1) return sections;

  // Otherwise, slice evenly across tiles so the cycling still has rhythm.
  if (tileCount <= 1) return [trimmed];
  const len = trimmed.length;
  const chunkSize = Math.max(120, Math.ceil(len / tileCount));
  const out: string[] = [];
  for (let i = 0; i < tileCount; i += 1) {
    const start = i * chunkSize;
    if (start >= len) break;
    out.push(trimmed.slice(start, start + chunkSize));
  }
  return out.length > 0 ? out : [trimmed];
}
