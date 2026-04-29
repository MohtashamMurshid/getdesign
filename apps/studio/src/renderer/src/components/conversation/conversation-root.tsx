import { memo, useCallback, useLayoutEffect, useRef } from "react";

import type {
  StudioChatStatus,
  StudioMessage,
} from "../../../../shared/studio-api";
import { cn } from "@/lib/utils";

import { AssistantTurn } from "./conversation-assistant-turn";
import { ThinkingRow } from "./conversation-thinking";
import { getRenderableParts } from "./conversation-utils";

export const Conversation = memo(function Conversation({
  messages,
  status,
  className,
}: {
  messages: StudioMessage[];
  status: StudioChatStatus;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const SCROLL_THRESHOLD = 80;

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
