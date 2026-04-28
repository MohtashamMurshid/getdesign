import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

import type {
  StudioChatStatus,
  StudioMessage,
} from "../../../shared/studio-api";
import { cn } from "./agent-elements/utils/cn";

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
      lastAssistant.content.trim().length === 0 ||
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

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

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
  const content = message.content;
  const isError = message.status === "error";

  if (!content && !isStreaming) return null;

  return (
    <div className="group/assistant relative flex flex-col gap-1.5">
      <SimpleMarkdown text={content} />
      {isStreaming && content.length > 0 ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-foreground align-text-bottom"
        />
      ) : null}
      {!isStreaming && content.length > 0 ? (
        <CopyButton text={content} />
      ) : null}
      {isError ? (
        <p className="mt-1 text-xs text-destructive">
          Generation failed. Try again.
        </p>
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

type Block =
  | { kind: "code"; language?: string; content: string }
  | { kind: "text"; content: string };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const fence = /```([\w-]*)\n([\s\S]*?)(?:```|$)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(text))) {
    if (match.index > cursor) {
      blocks.push({
        kind: "text",
        content: text.slice(cursor, match.index),
      });
    }
    blocks.push({
      kind: "code",
      language: match[1] || undefined,
      content: match[2] ?? "",
    });
    cursor = fence.lastIndex;
  }
  if (cursor < text.length) {
    blocks.push({ kind: "text", content: text.slice(cursor) });
  }
  return blocks;
}

const SimpleMarkdown = memo(function SimpleMarkdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-foreground">
      {blocks.map((block, index) =>
        block.kind === "code" ? (
          <CodeBlock
            key={index}
            language={block.language}
            content={block.content}
          />
        ) : (
          <TextBlock key={index} content={block.content} />
        ),
      )}
    </div>
  );
});

function TextBlock({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.replace(/\n+$/g, ""));
  return (
    <>
      {paragraphs.map((paragraph, index) => {
        if (!paragraph.trim()) return null;
        const lines = paragraph.split("\n");
        return (
          <p
            key={index}
            className="whitespace-pre-wrap break-words [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.92em]"
          >
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {renderInline(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

function renderInline(line: string) {
  const parts: ReactNode[] = [];
  const regex = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<code key={key++}>{m[1]}</code>);
    } else if (m[2] !== undefined) {
      parts.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      parts.push(<em key={key++}>{m[3]}</em>);
    }
    last = regex.lastIndex;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

function CodeBlock({
  language,
  content,
}: {
  language?: string;
  content: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [content]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span>{language ?? "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[12.5px] leading-relaxed text-foreground">
        <code>{content}</code>
      </pre>
    </div>
  );
}
