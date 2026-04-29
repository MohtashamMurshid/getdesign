import type { StudioMessage, StudioMessagePart } from "../../shared/studio-api";

import { asRecord } from "./record-utils";

export function computeContentFromParts(parts: StudioMessagePart[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

export function toAgentElementsToolName(toolName: string): string {
  const aliases: Record<string, string> = {
    bash: "Bash",
    read: "Read",
    edit: "Edit",
    write: "Write",
    grep: "Grep",
    find: "Glob",
    ls: "Glob",
  };
  return (
    aliases[toolName] ??
    toolName.replace(/(^|[-_])(\w)/g, (_match, _sep, char: string) =>
      char.toUpperCase(),
    )
  );
}

export function isArtifactFileTool(toolName: unknown): boolean {
  return toolName === "write" || toolName === "edit" || toolName === "bash";
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export function extractTitleFromAssistantMessage(
  message: unknown,
): string | undefined {
  const record = asRecord(message);
  const content = record?.["content"];
  if (!Array.isArray(content)) return undefined;
  const text = content
    .map((part) => {
      const partRecord = asRecord(part);
      return partRecord?.["type"] === "text" &&
        typeof partRecord["text"] === "string"
        ? (partRecord["text"] as string)
        : "";
    })
    .join(" ")
    .trim();
  if (!text) return undefined;
  const cleaned = text
    .split("\n")[0]!
    .replace(/^["'`*_\s]+|["'`*_\s.]+$/g, "")
    .trim();
  if (!cleaned) return undefined;
  return cleaned.length > 64 ? `${cleaned.slice(0, 61).trimEnd()}…` : cleaned;
}

export function getSessionTitle(sessionMessages: StudioMessage[]): string {
  const firstUser = sessionMessages.find((message) => message.role === "user");
  const raw = firstUser?.content.trim().replace(/\s+/g, " ");
  if (!raw) return "Untitled chat";

  const stripped = raw
    .replace(/^(please|hey|hi|hello|ok|okay|so|um|now|alright)[, ]+/i, "")
    .replace(/^(can|could|would|will)\s+(you|we)\s+(please\s+)?/i, "")
    .replace(/^(i\s+)?(want|need|would like|'?d like|wanna)\s+(to\s+)?/i, "")
    .replace(/^(let'?s|let us|help me|help us)\s+/i, "")
    .replace(/^(make|build|create|design|draft|write|generate)\s+(me\s+|us\s+)?/i, "Make ");

  const firstClause = stripped.split(/[.!?\n]/)[0]?.trim() ?? stripped;
  const compact = firstClause.split(/[,;:—–-]/)[0]?.trim() || firstClause;
  const capitalized = compact.charAt(0).toUpperCase() + compact.slice(1);

  if (capitalized.length <= 48) return capitalized || "Untitled chat";
  const words = capitalized.split(" ");
  let title = "";
  for (const word of words) {
    if ((title + (title ? " " : "") + word).length > 45) break;
    title = title ? `${title} ${word}` : word;
  }
  return `${title}…`;
}
