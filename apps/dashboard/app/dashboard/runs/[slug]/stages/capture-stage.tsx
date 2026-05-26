"use client";

import { useEffect, useRef, useState } from "react";

import type { StoredVisual } from "@/lib/runs-store";

import { tileUrl } from "../use-run-artifacts";

export function CaptureStage({
  runId,
  visual,
  expectedTiles,
}: {
  runId: string;
  visual: StoredVisual | null;
  expectedTiles?: number;
}) {
  const tiles = visual?.tiles ?? [];
  const [revealed, setRevealed] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tiles.length === 0) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = Math.min(i + 1, tiles.length);
      setRevealed(i);
      if (i >= tiles.length) window.clearInterval(interval);
    }, 220);
    return () => window.clearInterval(interval);
  }, [tiles.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [revealed]);

  const slots = Math.max(
    tiles.length,
    expectedTiles ?? 0,
    tiles.length === 0 ? 4 : 0,
  );

  return (
    <div className="flex h-full w-full bg-muted/30">
      <div
        ref={scrollerRef}
        className="relative mx-auto h-full w-full max-w-[78%] overflow-hidden"
      >
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: slots }).map((_, index) => {
            const tile = tiles[index];
            const isRevealed = index < revealed;

            if (!tile || !isRevealed) {
              return (
                <div
                  key={`placeholder-${index}`}
                  className="aspect-[16/10] w-full animate-pulse rounded-md bg-muted"
                />
              );
            }

            return (
              <img
                key={tile.file}
                src={tileUrl(runId, index)}
                alt={`Tile ${index + 1}`}
                width={tile.width}
                height={tile.height}
                className="w-full rounded-md border border-border/60 shadow-sm [animation:tileIn_500ms_ease-out]"
              />
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes tileIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
