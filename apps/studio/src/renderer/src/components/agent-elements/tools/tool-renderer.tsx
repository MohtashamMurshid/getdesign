import React, { memo } from "react";
import { toolRegistry, parseMcpToolType } from "./tool-registry";
import { getToolStatus } from "../utils/format-tool";
import { GenericTool } from "./generic-tool";
import { BashTool } from "./bash-tool";
import { EditTool } from "./edit-tool";
import { TodoTool } from "./todo-tool";
import { PlanTool } from "./plan-tool";
import { ToolGroup } from "./tool-group";
import { McpTool, unwrapMcpOutput } from "./mcp-tool";
import { ThinkingTool } from "./thinking-tool";
import { SearchTool } from "./search-tool";
import { QuestionTool } from "../question/question-tool";
import type { CustomToolRendererProps } from "../types";

export type ToolRendererProps = {
  part: any;
  nestedTools?: any[];
  chatStatus?: string;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
};

function deriveToolStatus(
  part: any,
  chatStatus?: string,
): CustomToolRendererProps["status"] {
  if (part.state === "input-streaming") return "streaming";
  if (part.state === "output-available") return "success";
  if (part.state === "output-error") return "error";
  const { isPending } = getToolStatus(part, chatStatus);
  return isPending ? "pending" : "success";
}

export const ToolRenderer = memo(function ToolRenderer({
  part,
  nestedTools,
  chatStatus,
  toolRenderers,
}: ToolRendererProps) {
  const partType = part.type as string;

  // Specialized tool components with variant dispatch
  switch (partType) {
    case "tool-Bash":
      return <BashTool part={part} />;
    case "tool-Edit":
    case "tool-Write":
      return <EditTool part={part} />;
    case "tool-WebSearch":
    case "tool-Grep":
    case "tool-Glob":
      return <SearchTool part={part} />;
    case "tool-PlanWrite":
      return <PlanTool part={part} chatStatus={chatStatus} />;
    case "tool-TodoWrite":
      return <TodoTool part={part} chatStatus={chatStatus} />;
    case "tool-Question":
      return <QuestionTool part={part} chatStatus={chatStatus} />;
    case "tool-Task":
    case "tool-Agent":
      const labelBase = part.type === "tool-Agent" ? "Agent" : "Task";
      return (
        <ToolGroup
          part={part}
          nestedTools={nestedTools}
          chatStatus={chatStatus}
          completeLabel={`${labelBase} completed`}
          shimmerLabel={`Running ${labelBase.toLowerCase()}`}
          interruptedLabel={`${labelBase} interrupted`}
          defaultOpen={false}
        />
      );
    case "tool-Thinking":
      return <ThinkingTool part={part} />;
  }

  // MCP tools
  const mcpInfo = parseMcpToolType(partType);
  if (mcpInfo) {
    // Custom renderer for user-defined tools
    if (toolRenderers && mcpInfo.serverName === "user-tools") {
      const CustomRenderer = toolRenderers[mcpInfo.toolName];
      if (CustomRenderer) {
        return (
          <CustomRenderer
            name={mcpInfo.toolName}
            input={(part.input ?? {}) as Record<string, unknown>}
            output={part.output ? unwrapMcpOutput(part.output) : undefined}
            status={deriveToolStatus(part, chatStatus)}
          />
        );
      }
    }
    return <McpTool part={part} mcpInfo={mcpInfo} chatStatus={chatStatus} />;
  }

  // Registry-based generic tools (Read, Grep, Glob, WebFetch, etc.)
  const meta = toolRegistry[partType];
  if (meta) {
    const { isPending, isError } = getToolStatus(part, chatStatus);
    return (
      <GenericTool
        icon={meta.icon}
        title={meta.title(part)}
        subtitle={meta.subtitle?.(part)}
        isPending={isPending}
        isError={isError}
      />
    );
  }

  // Fallback: show tool name
  const toolName = partType.startsWith("tool-") ? partType.slice(5) : partType;
  const { isPending, isError } = getToolStatus(part, chatStatus);
  return (
    <GenericTool
      title={isPending ? `Running ${toolName}` : toolName}
      isPending={isPending}
      isError={isError}
    />
  );
});
