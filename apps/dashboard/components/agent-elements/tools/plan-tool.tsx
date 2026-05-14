import { memo, useState } from "react";
import {
  IconChevronsDown,
  IconChevronsUp,
  IconFileDescription,
} from "@tabler/icons-react";
import { Markdown } from "../markdown";
import { IconSpinner } from "../icons";
import { areToolPropsEqual, getToolStatus } from "../utils/format-tool";
import { cn } from "../utils/cn";

export type Plan = {
  id?: string;
  title: string;
  summary?: string;
};

export type PlanToolProps = {
  part: {
    type: string;
    toolCallId?: string;
    state?: string;
    input?: {
      plan?: Plan;
      onApprove?: () => void;
      approveLabel?: string;
      approved?: boolean;
    };
  };
  chatStatus?: string;
};

function getPlanFileName(plan: Plan) {
  const rawId = plan.id?.trim();
  if (!rawId) return "plan-working.md";
  if (rawId.endsWith(".md")) return rawId;
  return `plan-${rawId}.md`;
}

export const PlanTool = memo(function PlanTool({
  part,
  chatStatus,
}: PlanToolProps) {
  const { isPending } = getToolStatus(part, chatStatus);
  const plan = part.input?.plan;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  if (!plan) return null;

  const fileName = getPlanFileName(plan);
  const summary = plan.summary?.trim() ?? "";
  const hasSummary = summary.length > 0;

  const approveLabel = part.input?.approveLabel ?? "Approve";
  const isAlreadyApproved = part.input?.approved || isApproved;
  const approveText = isAlreadyApproved ? "Approved" : approveLabel;

  const handleApprove = () => {
    if (isAlreadyApproved) return;
    setIsApproved(true);
    if (typeof part.input?.onApprove === "function") {
      part.input.onApprove();
    }
  };

  return (
    <div className="an-tool-plan rounded-an-tool-border-radius border border-border bg-an-tool-background overflow-hidden">
      <div className="h-7 pl-3 pr-2.5 flex items-center justify-between">
        <div className="min-w-0 flex items-center gap-1">
          {isPending ? (
            <IconSpinner className="w-3 h-3 text-an-tool-color-muted animate-spin shrink-0" />
          ) : (
            <IconFileDescription className="w-3.5 h-3.5 text-an-tool-color-muted shrink-0" />
          )}
          <span className="text-xs text-an-tool-color-muted truncate">
            {fileName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? "Collapse plan" : "Expand plan"}
          className="size-5 inline-flex items-center justify-center text-an-tool-color-muted"
        >
          {isExpanded ? (
            <IconChevronsUp className="w-3.5 h-3.5" />
          ) : (
            <IconChevronsDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="border-t border-border bg-background pt-2">
        <div className="space-y-1.5">
          <div className="text-sm text-an-tool-color px-3">{plan.title}</div>

          {hasSummary ? (
            <div className="relative">
              <div
                className={cn(
                  "px-3",
                  "text-sm text-an-tool-color-muted",
                  !isExpanded && "max-h-[94px] overflow-hidden",
                )}
              >
                <Markdown content={summary} className="text-sm" />
              </div>

              {!isExpanded && (
                <div className="absolute inset-x-0 bottom-0 h-16 pb-2 pl-3.5 pr-2">
                  <div className="absolute inset-x-0 bottom-0 h-full w-full bg-linear-to-b from-transparent from-0% to-background to-50%" />
                  <div className="h-full flex items-end justify-between relative">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="-mx-2 h-5 px-1.5 rounded-[4px] text-xs text-muted-foreground hover:text-an-tool-color"
                    >
                      Read detailed plan
                    </button>
                    {!isAlreadyApproved && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="h-5 px-1.5 rounded-[4px] text-xs font-medium bg-an-primary-color text-an-send-button-color hover:bg-an-primary-color/90 active:scale-[0.98] transition-[background-color,transform] duration-150"
                      >
                        {approveText}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-an-tool-color-muted">
              No plan summary provided.
            </div>
          )}
        </div>

        {(isExpanded || !hasSummary) && (
          <div className="mt-2 flex items-center justify-between pt-1.5 pb-2 pl-3.5 pr-2 border-t border-border bg-an-tool-background">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="-mx-2 h-5 px-1.5 rounded-[4px] text-xs text-muted-foreground hover:text-an-tool-color"
            >
              {isExpanded ? "Hide detailed plan" : "Read detailed plan"}
            </button>
            {!isAlreadyApproved && (
              <button
                type="button"
                onClick={handleApprove}
                className="h-5 px-1.5 rounded-[4px] text-xs font-medium bg-an-primary-color text-an-send-button-color hover:bg-an-primary-color/90 active:scale-[0.98] transition-[background-color,transform] duration-150"
              >
                {approveText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}, areToolPropsEqual);
