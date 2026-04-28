import { memo, useEffect, useMemo, useRef, useState } from "react";
import { toolRegistry } from "./tool-registry";
import { GenericTool } from "./generic-tool";
import { getToolStatus } from "../utils/format-tool";
import { cn } from "../utils/cn";
import { ToolRowBase } from "./tool-row-base";

export type ToolGroupProps = {
  part: any;
  nestedTools?: any[];
  chatStatus?: string;
  completeLabel: string;
  shimmerLabel?: string;
  interruptedLabel: string;
  maxVisibleTools?: number;
  defaultOpen?: boolean;
  showElapsed?: boolean;
};

function formatElapsedTime(ms: number): string {
  if (ms < 1000) return "";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatCount(value: number, label: string): string {
  return `${value} ${value === 1 ? label : `${label}s`}`;
}

function summarizeNestedTools(nestedTools: any[]): string {
  if (nestedTools.length === 0) return "";
  const fileTypes = new Set(["tool-Read", "tool-Edit", "tool-Write"]);
  const searchTypes = new Set([
    "tool-Search",
    "tool-Grep",
    "tool-Glob",
    "tool-WebSearch",
  ]);
  const commandTypes = new Set(["tool-Bash"]);

  let fileCount = 0;
  let searchCount = 0;
  let commandCount = 0;

  for (const tool of nestedTools) {
    if (fileTypes.has(tool.type)) fileCount += 1;
    else if (searchTypes.has(tool.type)) searchCount += 1;
    else if (commandTypes.has(tool.type)) commandCount += 1;
  }

  const parts: string[] = [];
  if (fileCount > 0) parts.push(formatCount(fileCount, "file"));
  if (searchCount > 0)
    parts.push(`${searchCount} ${searchCount === 1 ? "search" : "searches"}`);
  if (commandCount > 0) parts.push(formatCount(commandCount, "command"));

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function getNestedCounts(nestedTools: any[]) {
  const fileTypes = new Set(["tool-Read", "tool-Edit", "tool-Write"]);
  const searchTypes = new Set([
    "tool-Search",
    "tool-Grep",
    "tool-Glob",
    "tool-WebSearch",
  ]);
  let fileCount = 0;
  let searchCount = 0;

  for (const tool of nestedTools) {
    if (fileTypes.has(tool.type)) fileCount += 1;
    else if (searchTypes.has(tool.type)) searchCount += 1;
  }

  return { fileCount, searchCount };
}

function formatStreamCounts(fileCount: number, searchCount: number): string {
  const parts: string[] = [];
  if (fileCount > 0) parts.push(formatCount(fileCount, "file"));
  if (searchCount > 0)
    parts.push(`${searchCount} ${searchCount === 1 ? "search" : "searches"}`);
  return parts.join(", ");
}

export const ToolGroup = memo(function ToolGroup({
  part,
  nestedTools = [],
  chatStatus,
  completeLabel,
  shimmerLabel,
  interruptedLabel,
  maxVisibleTools = 5,
  defaultOpen,
  showElapsed = true,
}: ToolGroupProps) {
  const { isPending, isInterrupted } = getToolStatus(part, chatStatus);
  const description = part.input?.description || "";
  const [elapsedMs, setElapsedMs] = useState(0);
  const [expanded, setExpanded] = useState(defaultOpen ?? false);
  const [visibleCount, setVisibleCount] = useState(0);
  const startedAt =
    (part.callProviderMetadata?.custom?.startedAt as number | undefined) ??
    (part.startedAt as number | undefined);
  const hasNestedTools = nestedTools.length > 0;
  const streamKey = part.toolCallId ?? part.id ?? "";
  const outputDuration =
    part.output?.totalDurationMs ||
    part.output?.duration ||
    part.output?.duration_ms;
  const maskThreshold = 4;
  const streamHeight = Math.max(1, maxVisibleTools) * 28;
  const visibleToolCount = isPending
    ? Math.max(visibleCount, 0)
    : nestedTools.length;
  const wasPendingRef = useRef(isPending);
  const userToggledRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);
  const { fileCount, searchCount } = useMemo(() => {
    const visibleTools = isPending
      ? nestedTools.slice(0, Math.max(visibleCount, 0))
      : nestedTools;
    return getNestedCounts(visibleTools);
  }, [isPending, nestedTools, visibleCount]);
  const streamCounts = formatStreamCounts(fileCount, searchCount);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPending && startedAt) {
      setElapsedMs(Date.now() - startedAt);
      const interval = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPending, startedAt]);

  useEffect(() => {
    const wasPending = wasPendingRef.current;
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (isPending && !wasPending) {
      if (!userToggledRef.current && defaultOpen !== false) {
        setExpanded(false);
        openTimerRef.current = window.setTimeout(() => {
          setExpanded(true);
        }, 60);
      }
    }
    if (!isPending && wasPending) {
      setExpanded(false);
      userToggledRef.current = false;
    }
    wasPendingRef.current = isPending;
    return () => {
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };
  }, [defaultOpen, isPending]);

  useEffect(() => {
    if (!isPending || nestedTools.length === 0) {
      setVisibleCount(nestedTools.length);
      return;
    }
    let index = 1;
    setVisibleCount(Math.min(index, nestedTools.length));
    const interval = setInterval(() => {
      index += 1;
      setVisibleCount(Math.min(index, nestedTools.length));
      if (index >= nestedTools.length) clearInterval(interval);
    }, 450);
    return () => clearInterval(interval);
  }, [isPending, nestedTools.length, streamKey]);

  useEffect(() => {
    if (!isPending || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [isPending, visibleCount]);

  const subtitle = (() => {
    if (isPending && hasNestedTools) {
      return streamCounts;
    }

    if (!isPending && hasNestedTools) {
      const summary = summarizeNestedTools(nestedTools);
      if (summary) return summary;
    }

    if (!description) return "";
    return description.length > 60
      ? `${description.slice(0, 57)}...`
      : description;
  })();
  const elapsedTimeDisplay = formatElapsedTime(
    !isPending && outputDuration ? outputDuration : elapsedMs,
  );

  if (isInterrupted && !part.output) {
    return <ToolRowBase completeLabel={interruptedLabel} isAnimating={false} />;
  }

  return (
    <ToolRowBase
      completeLabel={completeLabel}
      shimmerLabel={shimmerLabel}
      isAnimating={isPending}
      detail={subtitle}
      expandable={hasNestedTools}
      expanded={expanded}
      onToggleExpand={() => {
        userToggledRef.current = true;
        setExpanded((prev) => !prev);
      }}
      trailingContent={
        showElapsed && elapsedTimeDisplay ? (
          <span className="font-normal tabular-nums shrink-0 text-an-foreground-muted/60">
            {elapsedTimeDisplay}
          </span>
        ) : undefined
      }
    >
      <div className="relative">
        {isPending && expanded && visibleToolCount > maskThreshold && (
          <div className="absolute inset-x-0 top-0 h-10 z-10 pointer-events-none bg-linear-to-b from-an-background to-transparent" />
        )}
        <div
          ref={listRef}
          className={cn(
            nestedTools.length > 1 ? "space-y-2" : "space-y-0",
            isPending &&
              expanded &&
              visibleToolCount > maskThreshold &&
              "overflow-y-auto",
          )}
          style={
            isPending && expanded && visibleToolCount > maskThreshold
              ? { height: `${streamHeight}px` }
              : undefined
          }
        >
          {(isPending
            ? nestedTools.slice(0, Math.max(visibleCount, 0))
            : nestedTools
          ).map((nestedPart, idx) => {
            const derivedPart = isPending
              ? {
                  ...nestedPart,
                  state:
                    idx === visibleCount - 1
                      ? "input-streaming"
                      : "output-available",
                }
              : nestedPart;
            const nestedMeta = toolRegistry[derivedPart.type];
            if (!nestedMeta) return null;
            const { isPending: nestedIsPending, isError: nestedIsError } =
              getToolStatus(derivedPart, chatStatus);
            return (
              <GenericTool
                key={idx}
                icon={nestedMeta.icon}
                title={nestedMeta.title(derivedPart)}
                subtitle={nestedMeta.subtitle?.(derivedPart)}
                isPending={nestedIsPending}
                isError={nestedIsError}
              />
            );
          })}
        </div>
      </div>
    </ToolRowBase>
  );
});
