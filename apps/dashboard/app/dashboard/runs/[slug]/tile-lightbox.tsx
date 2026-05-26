"use client";

import { useCallback, useEffect } from "react";

export type LightboxTile = {
  file: string;
  width: number;
  height: number;
  url?: string;
};

export function TileLightbox({
  runId,
  tiles,
  openIndex,
  onClose,
  onIndexChange,
}: {
  runId: string;
  tiles: LightboxTile[];
  openIndex: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const isOpen = openIndex !== null;

  const goPrev = useCallback(() => {
    if (openIndex === null) return;
    onIndexChange((openIndex - 1 + tiles.length) % tiles.length);
  }, [openIndex, tiles.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (openIndex === null) return;
    onIndexChange((openIndex + 1) % tiles.length);
  }, [openIndex, tiles.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") goPrev();
      else if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goPrev, goNext]);

  if (openIndex === null) return null;
  const tile = tiles[openIndex];
  if (!tile) return null;
  const url = tile.url;
  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot ${openIndex + 1} of ${tiles.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-white/20"
      >
        <CloseIcon />
      </button>

      {tiles.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous screenshot"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-white/20"
          >
            <ChevronIcon className="-translate-x-px rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Next screenshot"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-white/20"
          >
            <ChevronIcon className="translate-x-px" />
          </button>
        </>
      ) : null}

      <div
        className="relative max-h-[92vh] max-w-[92vw]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`Screenshot ${openIndex + 1}`}
          className="max-h-[92vh] max-w-[92vw] rounded-md object-contain shadow-2xl"
        />
        <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-white/70">
          {openIndex + 1} / {tiles.length}
        </p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
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
      className={className}
      aria-hidden
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}
