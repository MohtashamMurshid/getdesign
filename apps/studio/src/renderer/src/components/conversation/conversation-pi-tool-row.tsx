import {
  IconAlertTriangle,
  IconCheck,
  IconFile,
  IconLoader2,
  IconSearch,
  IconTerminal2,
  IconTool,
  IconWorldWww,
} from "@tabler/icons-react";
import type { StudioMessagePart } from "../../../../shared/studio-api";
import { cn } from "@/lib/utils";

import {
  getToolName,
  getToolStatus,
  getToolSubtitle,
  getToolTitle,
} from "./conversation-utils";

function getToolIcon(toolName: string) {
  if (toolName === "Bash") return IconTerminal2;
  if (toolName === "Read" || toolName === "Edit" || toolName === "Write")
    return IconFile;
  if (toolName === "Grep" || toolName === "Glob") return IconSearch;
  if (toolName === "WebFetch" || toolName === "WebSearch") return IconWorldWww;
  return IconTool;
}

export function PiToolRow({ part }: { part: StudioMessagePart }) {
  const { isPending, isError } = getToolStatus(part);
  const toolName = getToolName(part);
  const Icon = getToolIcon(toolName);
  const title = getToolTitle(part, toolName, isPending);
  const subtitle = getToolSubtitle(part);

  return (
    <div
      className={cn(
        "relative flex max-w-full items-center gap-2 overflow-hidden rounded-xl border px-3 py-2 text-[13px]",
        "border-border/70 bg-muted/35 text-muted-foreground transition-colors",
        isPending && "border-primary/30 bg-primary/5 text-foreground shadow-sm",
        isError && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
      aria-busy={isPending}
    >
      {isPending ? (
        <IconLoader2 size={15} className="shrink-0 animate-spin text-primary" />
      ) : isError ? (
        <IconAlertTriangle size={15} className="shrink-0 text-destructive" />
      ) : (
        <Icon size={15} className="shrink-0" />
      )}
      <span className="font-medium text-foreground">{title}</span>
      {subtitle ? (
        <span className="min-w-0 truncate text-muted-foreground">{subtitle}</span>
      ) : null}
      {isPending ? (
        <span className="ml-auto shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary">
          Loading
        </span>
      ) : isError ? null : (
        <IconCheck size={14} className="ml-auto shrink-0 text-muted-foreground" />
      )}
      {isPending ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-primary/10"
        >
          <span className="block h-full w-1/3 animate-[pi-tool-loading_1.15s_ease-in-out_infinite] rounded-full bg-primary/70" />
        </span>
      ) : null}
    </div>
  );
}
