import type { ReactNode } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { TextShimmer } from "../text-shimmer";
import { IconChevronRight } from "@tabler/icons-react";
import { cn } from "../utils/cn";

export type ToolRowBaseProps = {
  icon?: ReactNode;
  shimmerLabel?: string;
  completeLabel: string;
  isAnimating: boolean;
  isError?: boolean;
  detail?: string;
  trailingContent?: ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  defaultOpen?: boolean;
  onToggleExpand?: () => void;
  children?: ReactNode;
};

function StatusDot({
  isAnimating,
  isError,
}: {
  isAnimating: boolean;
  isError?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex items-center justify-center size-2 shrink-0",
      )}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full",
          isError
            ? "bg-red-500/80"
            : isAnimating
              ? "bg-an-foreground/40"
              : "bg-emerald-500/70",
        )}
      />
      {isAnimating && !isError && (
        <span className="absolute inset-0 rounded-full bg-an-foreground/30 animate-ping" />
      )}
    </span>
  );
}

export function ToolRowBase({
  icon,
  shimmerLabel,
  completeLabel,
  isAnimating,
  isError,
  detail,
  trailingContent,
  expandable = false,
  expanded,
  defaultOpen = false,
  onToggleExpand,
  children,
}: ToolRowBaseProps) {
  const isComplete = !isAnimating;
  const isExpanded = expanded ?? false;
  const canToggle = expandable && (isComplete || isExpanded || isAnimating);

  const row = (
    <div
      className={cn(
        "flex items-center max-w-full select-none gap-2 rounded-md px-1.5 -mx-1.5 py-0.5 transition-colors duration-150",
        canToggle
          ? "cursor-pointer hover:bg-an-foreground/[0.04]"
          : "cursor-default",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 text-sm text-muted-foreground">
        {icon ? (
          <span
            className={cn(
              "flex items-center justify-center size-3.5 shrink-0",
              isError ? "text-red-500" : "text-an-foreground-muted/80",
            )}
          >
            {icon}
          </span>
        ) : (
          <StatusDot isAnimating={isAnimating} isError={isError} />
        )}
        <span
          className={cn(
            "font-[450] whitespace-nowrap shrink-0",
            isError && "text-red-500/90",
          )}
        >
          {isAnimating && shimmerLabel ? (
            <TextShimmer
              as="span"
              duration={1.2}
              className="inline-flex items-center leading-none h-4 m-0"
            >
              {shimmerLabel}
            </TextShimmer>
          ) : (
            completeLabel
          )}
        </span>
        {detail && (
          <span className="font-mono text-[12px] truncate min-w-0 flex-1 text-an-foreground-muted/60">
            {detail}
          </span>
        )}
        {trailingContent}
      </div>
      {expandable && (isComplete || isExpanded || isAnimating) && (
        <div>
          <IconChevronRight
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-150 ease-out",
              "size-3",
              "rotate-0 group-data-panel-open:rotate-90",
            )}
          />
        </div>
      )}
    </div>
  );

  if (!expandable) {
    return <div className="flex flex-col gap-1">{row}</div>;
  }

  const rootProps =
    expanded === undefined
      ? { defaultOpen }
      : { open: expanded, onOpenChange: onToggleExpand };

  return (
    <Collapsible.Root className="flex flex-col gap-2 w-full" {...rootProps}>
      <Collapsible.Trigger
        className="group flex"
        disabled={!canToggle}
        aria-disabled={!canToggle}
      >
        {row}
      </Collapsible.Trigger>
      <Collapsible.Panel
        className={cn(
          "overflow-hidden",
          "h-[var(--collapsible-panel-height)] transition-all duration-150 ease-out",
          "data-ending-style:h-0 data-starting-style:h-0",
          "[&[hidden]:not([hidden='until-found'])]:hidden",
        )}
      >
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
