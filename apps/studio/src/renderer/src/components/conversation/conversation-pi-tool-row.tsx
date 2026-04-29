import {
  IconFile,
  IconSearch,
  IconTerminal2,
  IconTool,
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
        "flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-[13px]",
        "border-border/70 bg-muted/35 text-muted-foreground",
        isError && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <Icon size={15} className="shrink-0" />
      <span className="font-medium text-foreground">{title}</span>
      {subtitle ? <span className="min-w-0 truncate">{subtitle}</span> : null}
      {isPending ? (
        <span className="ml-auto size-1.5 shrink-0 animate-pulse rounded-full bg-current" />
      ) : null}
    </div>
  );
}
