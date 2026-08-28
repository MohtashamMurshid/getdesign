"use client";

import { Button } from "@/components/ui/button";

export function FailedStage({
  error,
  onRetry,
  onContinueTextOnly,
  isRetrying,
  isContinuing,
  showTextOnly,
}: {
  error: string;
  onRetry: () => void;
  onContinueTextOnly?: () => void;
  isRetrying: boolean;
  isContinuing: boolean;
  showTextOnly: boolean;
}) {
  const isBusy = isRetrying || isContinuing;
  return (
    <div className="flex h-full w-full items-center justify-center bg-destructive/5 p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Run failed</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        {showTextOnly ? (
          <p className="text-xs text-muted-foreground">
            Visual capture failed. Continue without screenshots, or retry.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={onRetry}
            disabled={isBusy}
          >
            {isRetrying ? "Retrying…" : "Retry"}
          </Button>
          {showTextOnly && onContinueTextOnly ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onContinueTextOnly}
              disabled={isBusy}
            >
              {isContinuing ? "Continuing…" : "Continue with text-only"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
