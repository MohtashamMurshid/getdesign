"use client";

import type { DesignDoc } from "@getdesign/types";

import { Button } from "@/components/ui/button";

export function RenderStage({
  doc,
  isComplete,
  onOpen,
}: {
  doc: DesignDoc | null;
  isComplete: boolean;
  onOpen?: () => void;
}) {
  const title = doc?.siteName ? `${doc.siteName} · design.md` : "design.md";

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/30 p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-background p-6 shadow-sm [animation:foldIn_600ms_ease-out]">
        <DocumentIcon />

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p className="text-xs text-muted-foreground">
            {isComplete
              ? "Your design system is ready."
              : "Composing final document…"}
          </p>
        </div>

        {isComplete ? (
          <Button size="sm" onClick={onOpen}>
            Open design.md
          </Button>
        ) : (
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite] bg-foreground/60" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes foldIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scaleY(0.6);
            transform-origin: top;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            transform-origin: top;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 48 56"
      width="44"
      height="52"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-foreground/80"
      aria-hidden
    >
      <path d="M6 4h26l10 10v38a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M32 4v10h10" />
      <path d="M12 24h24M12 32h24M12 40h16" strokeLinecap="round" />
    </svg>
  );
}
