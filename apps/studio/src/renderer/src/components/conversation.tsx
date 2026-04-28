import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IconCheck,
  IconCopy,
  IconFile,
  IconSearch,
  IconTerminal2,
  IconTool,
} from "@tabler/icons-react";
import { Streamdown } from "streamdown";

import type {
  StudioChatStatus,
  StudioMessage,
  StudioMessagePart,
} from "../../../shared/studio-api";
import { cn } from "@/lib/utils";

type ConversationProps = {
  messages: StudioMessage[];
  status: StudioChatStatus;
  className?: string;
};

const SCROLL_THRESHOLD = 80;

export const Conversation = memo(function Conversation({
  messages,
  status,
  className,
}: ConversationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const showThinking =
    isStreaming &&
    (!lastAssistant ||
      getRenderableParts(lastAssistant).length === 0 ||
      lastMessage?.role === "user");

  const isAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const next = el.scrollTop;
    if (next < lastScrollTopRef.current) {
      shouldAutoScrollRef.current = false;
    } else {
      shouldAutoScrollRef.current = isAtBottom();
    }
    lastScrollTopRef.current = next;
  }, [isAtBottom]);

  useLayoutEffect(() => {
    if (shouldAutoScrollRef.current) scrollToBottom();
  }, [messages, showThinking, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("flex-1 min-h-0 overflow-y-auto", className)}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {messages.map((message) =>
          message.role === "user" ? (
            <UserBubble key={message.id} message={message} />
          ) : (
            <AssistantTurn
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === lastAssistant?.id}
            />
          ),
        )}
        {showThinking ? <ThinkingRow /> : null}
        <div className="h-24" aria-hidden />
      </div>
    </div>
  );
});

function UserBubble({ message }: { message: StudioMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
        {message.content}
      </div>
    </div>
  );
}

function AssistantTurn({
  message,
  isStreaming,
}: {
  message: StudioMessage;
  isStreaming: boolean;
}) {
  const parts = useMemo(() => getRenderableParts(message), [message]);
  const copyText = useMemo(() => getCopyText(message), [message]);
  const isError = message.status === "error";

  if (parts.length === 0 && !isStreaming) return null;

  return (
    <div className="group/assistant relative flex flex-col gap-3">
      {parts.map((part, index) => {
        if (isTextPart(part)) {
          return (
            <AssistantMarkdown
              key={`${message.id}-text-${index}`}
              text={part.text}
              isStreaming={isStreaming}
            />
          );
        }
        if (isToolPart(part)) {
          return <PiToolRow key={part.toolCallId ?? `${message.id}-tool-${index}`} part={part} />;
        }
        return null;
      })}
      {isStreaming && parts.length > 0 ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-foreground align-text-bottom"
        />
      ) : null}
      {!isStreaming && copyText.length > 0 ? <CopyButton text={copyText} /> : null}
      {isError ? (
        <p className="mt-1 text-xs text-destructive">Generation failed. Try again.</p>
      ) : null}
    </div>
  );
}

function PiToolRow({ part }: { part: StudioMessagePart }) {
  const { isPending, isError } = getToolStatus(part);
  const toolName = getToolName(part);
  const Icon = getToolIcon(toolName);
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
      <span className="font-medium text-foreground">
        {isPending ? `Running ${toolName}` : toolName}
      </span>
      {subtitle ? <span className="min-w-0 truncate">{subtitle}</span> : null}
      {isPending ? (
        <span className="ml-auto size-1.5 shrink-0 animate-pulse rounded-full bg-current" />
      ) : null}
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="relative inline-flex">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-foreground/40" />
        <span className="relative inline-flex size-2 rounded-full bg-foreground/70" />
      </span>
      <span className="bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
        Thinking…
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const handle = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }, [text]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handle}
      className="mt-1 inline-flex items-center gap-1 self-start rounded-md px-1.5 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-muted/40 hover:text-foreground group-hover/assistant:opacity-100 focus-visible:opacity-100"
      aria-label="Copy message"
    >
      {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AssistantMarkdown({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  if (!text) return null;
  return (
    <div className="text-[14px] leading-relaxed text-foreground [&>*+*]:mt-3 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
      <Streamdown mode={isStreaming ? "streaming" : "static"}>{text}</Streamdown>
    </div>
  );
}

function getRenderableParts(message: StudioMessage): StudioMessagePart[] {
  const parts = message.parts?.length
    ? message.parts
    : ([{ type: "text", text: message.content }] satisfies StudioMessagePart[]);
  return parts.flatMap((part) => {
    if (isTextPart(part)) {
      const text = stripPiToolMarkup(part.text);
      return text.trim() ? [{ ...part, text }] : [];
    }
    return isToolPart(part) ? [part] : [];
  });
}

function getCopyText(message: StudioMessage): string {
  return getRenderableParts(message)
    .filter(isTextPart)
    .map((part) => part.text)
    .join("\n\n");
}

function isTextPart(part: StudioMessagePart): part is StudioMessagePart & { type: "text"; text: string } {
  return part.type === "text" && typeof part.text === "string";
}

function isToolPart(part: StudioMessagePart): boolean {
  return (
    typeof part.type === "string" &&
    part.type.startsWith("tool-") &&
    typeof part.toolCallId === "string"
  );
}

function getToolStatus(part: StudioMessagePart) {
  return {
    isPending: part.state !== "output-available" && part.state !== "output-error",
    isError: part.state === "output-error",
  };
}

function getToolName(part: StudioMessagePart): string {
  return part.type.startsWith("tool-") ? part.type.slice(5) : "Tool";
}

function getToolIcon(toolName: string) {
  if (toolName === "Bash") return IconTerminal2;
  if (toolName === "Read" || toolName === "Edit" || toolName === "Write") return IconFile;
  if (toolName === "Grep" || toolName === "Glob") return IconSearch;
  return IconTool;
}

function getToolSubtitle(part: StudioMessagePart): string {
  const input = asRecord(part.input);
  const output = part.output;
  const path =
    getString(input, "file_path") ??
    getString(input, "path") ??
    getString(input, "target_notebook");
  if (path) return path.split("/").pop() ?? path;

  const command = getString(input, "command");
  if (command) return command.replace(/\s+/g, " ").trim();

  const pattern = getString(input, "pattern") ?? getString(input, "query");
  if (pattern) return pattern;

  if (typeof output === "string" && output.trim()) return output.trim().slice(0, 80);
  return "";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function getString(record: Record<string, unknown> | undefined, key: string): string | undefined {
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
