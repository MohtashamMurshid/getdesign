import { memo, useCallback, useLayoutEffect, useRef } from "react";

import type {
  StudioChatStatus,
  StudioDeckPlanCardData,
  StudioMessage,
  StudioPlanConfirmedNoteData,
} from "../../../../shared/studio-api";
import {
  STUDIO_DECK_PLAN_PART_TYPE,
  STUDIO_HIDDEN_PROMPT_PART_TYPE,
  STUDIO_PLAN_CONFIRMED_PART_TYPE,
} from "../../../../shared/studio-api";
import { cn } from "@/lib/utils";

import { AssistantTurn } from "./conversation-assistant-turn";
import { ChatPlanCard, PlanConfirmedNote } from "./conversation-plan-card";
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
  // The thinking placeholder shouldn't appear just because we appended a
  // system "plan card" message that has no assistant text yet — system
  // messages are out-of-band, so look at the last *non-system* message when
  // deciding whether to show the placeholder.
  const lastNonSystem = [...messages]
    .reverse()
    .find((message) => message.role !== "system");
  const showThinking =
    isStreaming &&
    (!lastAssistant ||
      getRenderableParts(lastAssistant).length === 0 ||
      lastNonSystem?.role === "user");

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
        {messages.map((message) => {
          if (message.role === "user") {
            // Skip system-injected hidden prompts (e.g., the "plan confirmed,
            // proceed" nudge that resumes the agent without showing a fake
            // user bubble).
            if (message.parts?.[0]?.type === STUDIO_HIDDEN_PROMPT_PART_TYPE) {
              return null;
            }
            return <UserBubble key={message.id} message={message} />;
          }
          if (message.role === "system") {
            const firstPart = message.parts?.[0];
            if (firstPart?.type === STUDIO_DECK_PLAN_PART_TYPE) {
              return (
                <ChatPlanCard
                  key={message.id}
                  message={message}
                  data={firstPart.input as StudioDeckPlanCardData}
                  status={status}
                />
              );
            }
            if (firstPart?.type === STUDIO_PLAN_CONFIRMED_PART_TYPE) {
              return (
                <PlanConfirmedNote
                  key={message.id}
                  data={firstPart.input as StudioPlanConfirmedNoteData}
                />
              );
            }
            return null;
          }
          return (
            <AssistantTurn
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === lastAssistant?.id}
            />
          );
        })}
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
