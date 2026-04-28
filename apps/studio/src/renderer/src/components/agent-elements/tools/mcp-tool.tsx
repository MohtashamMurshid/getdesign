import { memo, useMemo } from "react";
import { Streamdown } from "streamdown";
import { createCodePlugin } from "@streamdown/code";
import { getToolStatus, areToolPropsEqual } from "../utils/format-tool";
import type { McpToolInfo } from "./tool-registry";
import { ToolRowBase } from "./tool-row-base";

export type McpToolProps = {
  part: any;
  mcpInfo: McpToolInfo;
  chatStatus?: string;
  defaultOpen?: boolean;
};

const PRIORITY_ARGS = [
  "query",
  "question",
  "email",
  "name",
  "id",
  "customer",
  "url",
  "issue",
  "body",
  "summary",
  "title",
];

const ACTIVE_VERBS: Record<string, string> = {
  List: "Listing",
  Get: "Getting",
  Create: "Creating",
  Update: "Updating",
  Delete: "Deleting",
  Search: "Searching",
  Fetch: "Fetching",
  Retrieve: "Retrieving",
  Send: "Sending",
  Generate: "Generating",
  Add: "Adding",
  Remove: "Removing",
  Modify: "Modifying",
  Draft: "Drafting",
  Manage: "Managing",
  Query: "Querying",
  Start: "Starting",
  Set: "Setting",
  Check: "Checking",
  Find: "Finding",
};

const COMPLETED_VERBS: Record<string, string> = {
  List: "Listed",
  Get: "Got",
  Create: "Created",
  Update: "Updated",
  Delete: "Deleted",
  Search: "Searched",
  Fetch: "Fetched",
  Retrieve: "Retrieved",
  Send: "Sent",
  Generate: "Generated",
  Add: "Added",
  Remove: "Removed",
  Modify: "Modified",
  Draft: "Drafted",
  Manage: "Managed",
  Query: "Queried",
  Start: "Started",
  Set: "Set",
  Check: "Checked",
  Find: "Found",
};

function getActiveTitle(info: McpToolInfo): string {
  const words = info.displayName.split(" ");
  const verb = words[0];
  const rest = words.slice(1).join(" ");
  const active = ACTIVE_VERBS[verb];
  if (active) return rest ? `${active} ${rest}` : active;
  return info.displayName;
}

function getCompletedTitle(info: McpToolInfo): string {
  const words = info.displayName.split(" ");
  const verb = words[0];
  const rest = words.slice(1).join(" ");
  const completed = COMPLETED_VERBS[verb];
  return completed
    ? rest
      ? `${completed} ${rest}`
      : completed
    : info.displayName;
}

function formatMcpArgs(input: any): string {
  if (!input || typeof input !== "object") return "";
  const entries = Object.entries(input).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";

  const sorted = [...entries].sort(([a], [b]) => {
    const ai = PRIORITY_ARGS.indexOf(a);
    const bi = PRIORITY_ARGS.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });

  const parts: string[] = [];
  for (const [key, value] of sorted) {
    if (parts.length >= 2) break;
    const val = typeof value === "string" ? value : JSON.stringify(value);
    const display = val.length > 30 ? val.slice(0, 27) + "..." : val;
    parts.push(`${key}: ${display}`);
  }
  return parts.join("  ");
}

export function unwrapMcpOutput(output: any): any {
  if (!output) return output;
  if (Array.isArray(output)) {
    const textParts: string[] = [];
    for (const block of output) {
      if (block?.type === "text" && typeof block?.text === "string") {
        textParts.push(block.text);
      }
    }
    if (textParts.length > 0) {
      const combined = textParts.join("");
      try {
        return JSON.parse(combined);
      } catch {
        return combined;
      }
    }
    return output;
  }
  if (output?.type === "text" && typeof output?.text === "string") {
    try {
      return JSON.parse(output.text);
    } catch {
      return output.text;
    }
  }
  if (typeof output === "string") {
    try {
      return JSON.parse(output);
    } catch {
      return output;
    }
  }
  return output;
}

function formatOutputForDisplay(output: any): string {
  const unwrapped = unwrapMcpOutput(output);
  if (typeof unwrapped === "string") {
    return unwrapped.length > 3000
      ? unwrapped.slice(0, 3000) + "\n..."
      : unwrapped;
  }
  const text = JSON.stringify(unwrapped, null, 2);
  return text.length > 3000 ? text.slice(0, 3000) + "\n..." : text;
}

const code = createCodePlugin({
  themes: ["github-light", "github-dark"],
});

export const McpTool = memo(function McpTool({
  part,
  mcpInfo,
  chatStatus,
  defaultOpen,
}: McpToolProps) {
  const { isPending, isInterrupted } = getToolStatus(part, chatStatus);

  const title = useMemo(() => {
    if (part.state === "input-streaming")
      return `Preparing ${mcpInfo.displayName}`;
    if (isPending) return getActiveTitle(mcpInfo);
    return getCompletedTitle(mcpInfo);
  }, [part.state, isPending, mcpInfo]);

  const subtitle = useMemo(() => {
    if (part.state === "input-streaming") return "";
    return formatMcpArgs(part.input);
  }, [part.input, part.state]);

  const displayOutput = useMemo(() => {
    if (!part.output) return null;
    return formatOutputForDisplay(part.output);
  }, [part.output]);

  const codeBlock = useMemo(() => {
    if (!displayOutput) return null;
    const trimmed = displayOutput.trim();
    if (!trimmed) return null;
    const language =
      trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "text";
    return `\`\`\`${language}\n${displayOutput}\n\`\`\``;
  }, [displayOutput]);

  const hasExpandableContent = !!codeBlock && !isPending;

  if (isInterrupted && !part.output) {
    return (
      <span className="text-sm text-an-tool-color-muted">
        {mcpInfo.displayName} interrupted
      </span>
    );
  }

  return (
    <div className="an-tool-mcp">
      <ToolRowBase
        shimmerLabel={title}
        completeLabel={title}
        isAnimating={isPending}
        detail={subtitle || undefined}
        trailingContent={undefined}
        expandable={hasExpandableContent}
        defaultOpen={defaultOpen}
      >
        {codeBlock && (
          <div className="an-markdown text-[12px]">
            <Streamdown plugins={{ code }} controls={{ code: false }}>
              {codeBlock}
            </Streamdown>
          </div>
        )}
      </ToolRowBase>
    </div>
  );
}, areToolPropsEqual);
