"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "./utils/cn";

export type LightboxImage = {
  /** Stable identifier — used for keys and to know which image is active. */
  id: string;
  /** Resolvable image URL (https / data: / blob:). */
  url: string;
  /** Optional filename used for the alt text. */
  filename?: string;
};

export type ImageLightboxProps = {
  /** Whether the overlay is open. */
  open: boolean;
  /** Close handler — wired to overlay click, X button, and Esc key. */
  onClose: () => void;
  /** Full set of images for gallery navigation. */
  images: LightboxImage[];
  /** Index in `images` to start on. */
  initialIndex?: number;
};

/**
 * Portal-based fullscreen image preview. Renders to `document.body` so it
 * escapes any clipping/transform/stacking context. Adapted from the
 * 21st-private-1 desktop chat — without copy/save (those are
 * desktop-API-specific).
 */
export function ImageLightbox({
  open,
  onClose,
  images,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasMultipleImages = images.length > 1;

  // Sync the active index whenever the consumer re-opens with a new initial.
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const goToPrevious = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    },
    [images.length],
  );

  const goToNext = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    },
    [images.length],
  );

  // Esc / arrow-key navigation. Capture phase so we beat any local handlers
  // (e.g. an Editor that swallows Esc).
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          onClose();
          break;
        case "ArrowLeft":
          if (hasMultipleImages) goToPrevious();
          break;
        case "ArrowRight":
          if (hasMultipleImages) goToNext();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () =>
      window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, hasMultipleImages, onClose, goToPrevious, goToNext]);

  // Lock body scroll while open so the page underneath doesn't move.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (typeof document === "undefined") return null;
  if (!open) return null;
  const currentImage = images[currentIndex] ?? images[0];
  if (!currentImage?.url) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close fullscreen (Esc)"
        className="absolute top-4 right-4 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <IconX className="size-5" />
      </button>

      {hasMultipleImages && (
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Previous image (←)"
          className="absolute left-4 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <IconChevronLeft className="size-6" />
        </button>
      )}

      <img
        src={currentImage.url}
        alt={currentImage.filename ?? "Image preview"}
        className="max-w-[90vw] max-h-[85vh] object-contain select-none"
        onClick={(event) => event.stopPropagation()}
        draggable={false}
      />

      {hasMultipleImages && (
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next image (→)"
          className="absolute right-4 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <IconChevronRight className="size-6" />
        </button>
      )}

      {hasMultipleImages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to image ${idx + 1}`}
                className={cn(
                  "size-2 rounded-full transition-all",
                  idx === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}
