import type { StudioMessage, StudioMessagePart } from "../../../../shared/studio-api";

import { asRecord } from "@/lib/type-guards";

export function getRenderableParts(message: StudioMessage): StudioMessagePart[] {
  const parts = message.parts?.length
    ? message.parts
    : ([{ type: "text", text: message.content }] satisfies StudioMessagePart[]);
  return parts.flatMap((part: StudioMessagePart) => {
    if (isTextPart(part)) {
      const text = stripPiToolMarkup(part.text);
      return text.trim() ? [{ ...part, text }] : [];
    }
    return isToolPart(part) ? [part] : [];
  });
}

export function getCopyText(message: StudioMessage): string {
  return getRenderableParts(message)
    .filter(isTextPart)
    .map((part) => part.text)
    .join("\n\n");
}

export function isTextPart(
  part: StudioMessagePart,
): part is StudioMessagePart & { type: "text"; text: string } {
  return part.type === "text" && typeof part.text === "string";
}

export function isToolPart(part: StudioMessagePart): boolean {
  return (
    typeof part.type === "string" &&
    part.type.startsWith("tool-") &&
    typeof part.toolCallId === "string"
  );
}

export function getToolStatus(part: StudioMessagePart) {
  return {
    isPending:
      part.state !== "output-available" && part.state !== "output-error",
    isError: part.state === "output-error",
  };
}

export function getToolName(part: StudioMessagePart): string {
  return part.type.startsWith("tool-") ? part.type.slice(5) : "Tool";
}

export function getToolTitle(
  part: StudioMessagePart,
  toolName: string,
  isPending: boolean,
): string {
  const verb = isPending ? "Running" : "Ran";
  if (toolName === "Write") return isPending ? "Writing file" : "Wrote file";
  if (toolName === "Edit") return isPending ? "Editing file" : "Edited file";
  if (toolName === "Read") return isPending ? "Reading file" : "Read file";
  if (toolName === "Bash") return isPending ? "Running command" : "Ran command";
  if (toolName === "Grep" || toolName === "Glob") {
    return isPending ? "Searching files" : "Searched files";
  }
  if (toolName === "WebFetch") {
    const url = getToolUrl(part);
    if (url?.startsWith("https://pi.dev/docs/latest/sdk")) {
      return isPending ? "Loading Pi SDK docs" : "Loaded Pi SDK docs";
    }
    return isPending ? "Loading web page" : "Loaded web page";
  }
  if (toolName === "WebSearch") return isPending ? "Searching web" : "Searched web";
  if (toolName === "Thinking") return "Thinking";
  if (part.state === "output-error") return `${toolName} failed`;
  return `${verb} ${toolName}`;
}

export function getToolSubtitle(part: StudioMessagePart): string {
  const input = asRecord(part.input);
  const output = part.output;
  const path =
    getString(input, "file_path") ??
    getString(input, "path") ??
    getString(input, "target_notebook");
  if (path) return path.split("/").pop() ?? path;

  const command = getString(input, "command");
  if (command) return command.replace(/\s+/g, " ").trim();

  const url = getToolUrl(part);
  if (url) return formatToolUrl(url);

  const pattern = getString(input, "pattern") ?? getString(input, "query");
  if (pattern) return pattern;

  if (typeof output === "string" && output.trim()) return output.trim().slice(0, 80);
  return "";
}

function getToolUrl(part: StudioMessagePart): string | undefined {
  const input = asRecord(part.input);
  return (
    getString(input, "url") ??
    getString(input, "uri") ??
    getString(input, "link")
  );
}

function formatToolUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function getThinkingText(part: StudioMessagePart): string {
  const out = part.output;
  if (typeof out === "string") return out;
  const input = asRecord(part.input);
  const fromInput =
    getString(input, "thinking") ??
    getString(input, "thought") ??
    getString(input, "reasoning") ??
    getString(input, "text");
  return fromInput ?? "";
}

function getString(
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stripPiToolMarkup(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "")
    .replace(/<tool_call>[\s\S]*$/g, "")
    .replace(/<\/tool_call>/g, "")
    .replace(/<tool_use>[\s\S]*?<\/tool_use>/g, "")
    .replace(/<tool_use>[\s\S]*$/g, "")
    .replace(/<\/tool_use>/g, "")
    .replace(/<pi:[\s\S]*?<\/pi:[^>]+>/g, "")
    .replace(/<\/?pi:[^>]+>/g, "")
    .replace(/\bpi:[\w-]+\s+\[blocked\]\s*/g, "")
    .trim();
}
