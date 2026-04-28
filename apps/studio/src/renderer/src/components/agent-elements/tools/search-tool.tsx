import { memo } from "react";
import type { TimelineStep, StepState } from "../types/timeline";
import type { SourceType } from "../icons/source-icons";
import { IconFileText } from "@tabler/icons-react";
import { ToolRowBase } from "./tool-row-base";
import { useToolComplete } from "../hooks/use-tool-complete";
import {
  mapToolInvocationToStep,
  mapToolStateToStepState,
} from "../utils/tool-adapters";
import { cn } from "../utils/cn";

export type SearchResult = { source: SourceType; title: string; date: string };

export type SearchGroupRichProps = {
  toolSteps: Extract<TimelineStep, { type: "tool-call" }>[];
  stepStates: Record<string, StepState>;
  onStepComplete: (id: string) => void;
  results?: SearchResult[];
  defaultOpen?: boolean;
};

export function SearchGroupRich({
  toolSteps,
  stepStates,
  onStepComplete,
  results = [],
  defaultOpen,
}: SearchGroupRichProps) {
  const anyAnimating = toolSteps.some((s) => stepStates[s.id] === "animating");
  const searchQuery =
    toolSteps.find((s) => s.searchQuery)?.searchQuery ?? "searching...";
  const totalResults = results.length;
  // Only expose the expand affordance once there is something useful to show.
  // While the search is still streaming we have no results yet and the panel
  // header is just "Searched for <same query>" — redundant with the row
  // label. Once results arrive the panel becomes meaningful.
  const hasExpandableContent = totalResults > 0;

  function CompleteTracker({
    step,
  }: {
    step: Extract<TimelineStep, { type: "tool-call" }>;
  }) {
    useToolComplete(stepStates[step.id] === "animating", step.duration, () =>
      onStepComplete(step.id),
    );
    return null;
  }

  return (
    <>
      {toolSteps.map((step) => (
        <CompleteTracker key={step.id} step={step} />
      ))}
      <ToolRowBase
        shimmerLabel="Searching..."
        completeLabel={`Found ${totalResults} results`}
        isAnimating={anyAnimating}
        expandable={hasExpandableContent}
        defaultOpen={defaultOpen}
      >
        <div className="rounded-an-tool-border-radius overflow-hidden bg-an-tool-background border border-border">
          <div className="flex items-center px-2.5 py-0 border-b border-an-tool-border-color h-7 text-xs gap-1">
            <span className="text-foreground font-medium">Searched for</span>{" "}
            <span className="text-muted-foreground truncate">
              &ldquo;{searchQuery}&rdquo;
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto bg-background">
            <div className="flex flex-col gap-1 p-1">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded-[calc(var(--an-tool-border-radius)-4px)] cursor-default",
                    "hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center justify-center w-4 h-4 shrink-0 text-muted-foreground">
                    <IconFileText className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-foreground/90 truncate flex-1 min-w-0">
                    {result.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {result.date || result.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ToolRowBase>
    </>
  );
}

export type SearchToolProps = {
  part: {
    id?: string;
    toolCallId?: string;
    type?: string;
    state?: string;
    input?: Record<string, unknown>;
    args?: Record<string, unknown>;
    output?: Record<string, unknown>;
    result?: Record<string, unknown>;
  };
  results?: SearchResult[];
  defaultOpen?: boolean;
};

function normalizeResults(value: unknown): SearchResult[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const source = (item as { source?: unknown }).source;
      const title = (item as { title?: unknown }).title;
      const date = (item as { date?: unknown }).date;
      if (
        typeof source !== "string" ||
        typeof title !== "string" ||
        typeof date !== "string"
      ) {
        return null;
      }
      return { source: source as SourceType, title, date };
    })
    .filter((item): item is SearchResult => Boolean(item));
  return parsed.length > 0 ? parsed : undefined;
}

export const SearchTool = memo(function SearchTool({
  part,
  results,
  defaultOpen,
}: SearchToolProps) {
  const step = mapToolInvocationToStep(part.toolCallId ?? part.id ?? "search", {
    toolName: part.type?.replace("tool-", "") || "WebSearch",
    args: part.input ?? part.args ?? {},
    state:
      part.state === "output-available"
        ? "result"
        : part.state === "input-streaming"
          ? "partial-call"
          : "call",
    result: part.output ?? part.result,
  });
  const stepState = mapToolStateToStepState(
    part.state === "output-available"
      ? "result"
      : part.state === "input-streaming"
        ? "partial-call"
        : "call",
  );
  const stepStates = { [step.id]: stepState };
  const noop = () => {};

  return (
    <SearchGroupRich
      toolSteps={[step]}
      stepStates={stepStates}
      onStepComplete={noop}
      results={
        results ??
        normalizeResults(part.output?.results) ??
        normalizeResults(part.result?.results)
      }
      defaultOpen={defaultOpen}
    />
  );
});
