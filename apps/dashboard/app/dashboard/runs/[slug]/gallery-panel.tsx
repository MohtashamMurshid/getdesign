"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";

import { TileLightbox, type LightboxTile } from "./tile-lightbox";

const OPEN_WIDTH = 320;
const COLLAPSED_WIDTH = 84;
const STORAGE_KEY = "getdesign.gallery.collapsed";

export function GalleryPanel({
  runId,
  userId,
  initialTiles,
  totalExpected,
  highlightIndex,
}: {
  runId: string;
  userId: string;
  initialTiles: LightboxTile[];
  totalExpected?: number;
  highlightIndex?: number;
}) {
  const live = useQuery(api.designRunArtifacts.getTileUrls, {
    runId: runId as Id<"designRuns">,
    userId,
  });

  const tiles: LightboxTile[] =
    Array.isArray(live) && live.length > 0 ? live : initialTiles;

  const [collapsed, setCollapsed] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Restore the user's preference on mount.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollapsed(true);
      }
    } catch {
      // ignore — storage may be disabled
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const expectedSlots = Math.max(
    tiles.length,
    totalExpected ?? 0,
    tiles.length === 0 ? 4 : 0,
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? COLLAPSED_WIDTH : OPEN_WIDTH }}
      initial={false}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="sticky top-0 hidden h-svh shrink-0 self-start overflow-hidden border-l bg-background/95 backdrop-blur lg:flex lg:flex-col"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand gallery" : "Collapse gallery"}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronIcon flipped={collapsed} />
        </button>
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              key="title"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 items-baseline gap-2"
            >
              <p className="text-xs font-semibold tracking-tight">Gallery</p>
              <p className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                {tiles.length}
                {totalExpected ? ` / ${totalExpected}` : ""}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          collapsed ? "px-2 py-2" : "p-2",
        )}
      >
        <div className={cn("flex flex-col", collapsed ? "gap-1.5" : "gap-2")}>
          {Array.from({ length: expectedSlots }).map((_, index) => {
            const tile = tiles[index];
            const isHighlighted = highlightIndex === index;

            if (!tile?.url) {
              return (
                <div
                  key={`slot-${index}`}
                  className="aspect-[16/10] w-full animate-pulse rounded-md bg-muted"
                />
              );
            }

            return (
              <motion.button
                key={tile.file}
                layoutId={`tile-${index}`}
                type="button"
                onClick={() => setOpenIndex(index)}
                initial={{ opacity: 0, scale: 0.6, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={cn(
                  "group relative block w-full cursor-zoom-in overflow-hidden rounded-md border shadow-sm",
                  isHighlighted
                    ? "border-foreground/70 shadow-md ring-2 ring-foreground/30"
                    : "border-border/60 hover:shadow-md",
                )}
                title={`Tile ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tile.url}
                  alt={`Screenshot ${index + 1}`}
                  width={tile.width}
                  height={tile.height}
                  loading="lazy"
                  className="block w-full transition-opacity group-hover:opacity-95"
                />
                {!collapsed ? (
                  <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80 shadow-sm backdrop-blur">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ) : null}

                <AnimatePresence>
                  {isHighlighted ? (
                    <motion.div
                      key="scan"
                      className="pointer-events-none absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-foreground/20 to-transparent"
                        animate={{ y: ["-30%", "120%"] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      <TileLightbox
        runId={runId}
        tiles={tiles}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </motion.aside>
  );
}

function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("transition-transform", flipped ? "rotate-180" : "")}
      aria-hidden
    >
      <path d="M10 3l-5 5 5 5" />
    </svg>
  );
}
