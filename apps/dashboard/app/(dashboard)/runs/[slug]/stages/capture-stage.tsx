"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { StoredVisual } from "@/lib/runs-store";

import { tileUrl } from "../use-run-artifacts";

/**
 * Stage canvas for the Capture phase. Renders a "now arriving" tile preview
 * in the center; once the rail has had time to register the new tile (via
 * the shared `layoutId` set up in `LiveTileRail`), we drop our preview so
 * Motion's layout animation flies the tile from the canvas into the rail.
 */
export function CaptureStage({
  visual,
  expectedTiles,
}: {
  visual: StoredVisual | null;
  expectedTiles?: number;
}) {
  const tiles = visual?.tiles ?? [];
  const total = Math.max(tiles.length, expectedTiles ?? 0);

  // Index of the most recently landed tile; null until any have arrived.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const seenCountRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (tiles.length > seenCountRef.current) {
      const next = tiles.length - 1;
      seenCountRef.current = tiles.length;
      setPreviewIndex(next);

      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      // Keep the preview centered briefly, then unmount so layoutId hands the
      // element off to the rail with a smooth shared-layout tween.
      hideTimerRef.current = window.setTimeout(() => {
        setPreviewIndex(null);
      }, 700);
    }
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [tiles.length]);

  const previewTile = previewIndex !== null ? tiles[previewIndex] : null;
  const previewUrl = previewIndex !== null ? tileUrl(visual, previewIndex) : null;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted/10 p-6">
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Capturing
        </p>
        <span className="rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {tiles.length}
          {total ? ` / ${total}` : ""}
        </span>
      </div>

      {/* Empty-state: gentle placeholder before any tile lands */}
      {tiles.length === 0 ? (
        <div className="flex flex-col items-center gap-3">
          <div className="aspect-[16/10] w-72 animate-pulse rounded-md border bg-muted" />
          <p className="font-mono text-[10px] text-muted-foreground">
            warming up the headless browser…
          </p>
        </div>
      ) : null}

      <AnimatePresence>
        {previewIndex !== null && previewTile && previewUrl ? (
          <motion.div
            key={`preview-${previewIndex}`}
            layoutId={`tile-${previewIndex}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="overflow-hidden rounded-md border border-border/60 shadow-lg"
            style={{ maxWidth: "70%", maxHeight: "78%" }}
          >
            <img
              src={previewUrl}
              alt={`Tile ${previewIndex + 1}`}
              width={previewTile.width}
              height={previewTile.height}
              className="block w-full"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
