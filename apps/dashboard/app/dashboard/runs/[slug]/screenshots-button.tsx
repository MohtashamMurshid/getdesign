"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TileLightbox, type LightboxTile } from "./tile-lightbox";

export function ScreenshotsButton({
  runId,
  tiles,
}: {
  runId: string;
  tiles: LightboxTile[];
}) {
  const [gridOpen, setGridOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gridOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && lightboxIndex === null) setGridOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [gridOpen, lightboxIndex]);

  if (tiles.length === 0) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setGridOpen(true)}
                aria-label={`View ${tiles.length} screenshot${tiles.length === 1 ? "" : "s"}`}
              >
                <HugeiconsIcon icon={Image01Icon} />
              </Button>
            }
          />
          <TooltipContent>
            View screenshots ({tiles.length})
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {gridOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Screenshots"
          className="fixed inset-0 z-40 flex flex-col bg-background/95 backdrop-blur-sm"
          onClick={() => setGridOpen(false)}
        >
          <div
            className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">Screenshots</h2>
              <p className="text-xs text-muted-foreground">
                {tiles.length} tile{tiles.length === 1 ? "" : "s"} · click any
                to zoom
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGridOpen(false)}
              aria-label="Close screenshots"
            >
              Close
            </Button>
          </div>

          <div
            className="flex-1 overflow-y-auto p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tiles.map((tile, index) => {
                const url = tile.url;
                if (!url) return null;
                return (
                  <button
                    key={tile.file}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="group block cursor-zoom-in overflow-hidden rounded-md border border-border/60 bg-muted/30 shadow-sm transition-shadow hover:shadow-md"
                    title={`Tile ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Tile ${index + 1}`}
                      width={tile.width}
                      height={tile.height}
                      loading="lazy"
                      className="w-full transition-opacity group-hover:opacity-90"
                    />
                    <p className="px-2 py-1.5 text-left font-mono text-[10px] text-muted-foreground">
                      {String(index + 1).padStart(3, "0")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <TileLightbox
        runId={runId}
        tiles={tiles}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
