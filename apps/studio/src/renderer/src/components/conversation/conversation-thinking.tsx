import { useEffect, useRef, useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";

import type { StudioMessagePart } from "../../../../shared/studio-api";
import { cn } from "@/lib/utils";

import { getThinkingText, getToolStatus } from "./conversation-utils";

export function ThinkingBlock({
  part,
  isStreaming,
}: {
  part: StudioMessagePart;
  isStreaming: boolean;
}) {
  const { isPending } = getToolStatus(part);
  const text = getThinkingText(part);
  const animated = isPending && isStreaming;
  const [open, setOpen] = useState(animated);
  const wasAnimatingRef = useRef(animated);

  useEffect(() => {
    if (animated) {
      wasAnimatingRef.current = true;
      setOpen(true);
    } else if (wasAnimatingRef.current) {
      wasAnimatingRef.current = false;
      setOpen(false);
    }
  }, [animated]);

  const label = animated ? "Thinking" : "Thought";
  const canToggle = text.trim().length > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => canToggle && setOpen((v) => !v)}
        disabled={!canToggle}
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-md text-[13px] text-muted-foreground transition-colors",
          canToggle && "hover:text-foreground cursor-pointer",
          !canToggle && "cursor-default",
        )}
        aria-expanded={open}
      >
        <IconChevronRight
          size={13}
          className={cn(
            "shrink-0 transition-transform duration-150 ease-out",
            open && "rotate-90",
            !canToggle && "opacity-0",
          )}
        />
        <span
          className={cn(
            "font-medium",
            animated &&
              "bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer",
          )}
        >
          {label}
        </span>
      </button>
      {open && canToggle ? (
        <div className="ml-[6px] border-l border-border/60 pl-3">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground/90">
            {text}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ThinkingRow() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="relative inline-flex">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-foreground/40" />
        <span className="relative inline-flex size-2 rounded-full bg-foreground/70" />
      </span>
      <span className="bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
        Thinking…
      </span>
    </div>
  );
}
