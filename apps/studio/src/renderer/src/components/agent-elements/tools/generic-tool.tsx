import React, { memo } from "react";
import type { TimelineStep, StepState } from "../types/timeline";
import { useToolComplete } from "../hooks/use-tool-complete";
import { ToolRowBase } from "./tool-row-base";

export type GenericToolRowProps = {
  step: Extract<TimelineStep, { type: "tool-call" }>;
  state: StepState;
  onComplete: () => void;
};

export function GenericToolRow({
  step,
  state,
  onComplete,
}: GenericToolRowProps) {
  useToolComplete(state === "animating", step.duration, onComplete);
  const isPending = state === "animating";

  return (
    <ToolRowBase
      shimmerLabel={step.toolName}
      completeLabel={step.toolName}
      isAnimating={isPending}
      detail={step.toolDetail}
    />
  );
}

export type GenericToolProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  isPending: boolean;
  isError?: boolean;
};

export const GenericTool = memo(function GenericTool({
  icon,
  title,
  subtitle,
  isPending,
  isError,
}: GenericToolProps) {
  const Icon = icon;

  return (
    <ToolRowBase
      icon={
        Icon ? (
          <Icon className="w-full h-full shrink-0" />
        ) : undefined
      }
      shimmerLabel={title}
      completeLabel={title}
      isAnimating={isPending}
      isError={isError}
      detail={subtitle}
    />
  );
});
