import React, {
  memo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import type { UIMessage, ChatStatus } from "ai";
import { cn } from "./utils/cn";

import { UserMessage } from "./user-message";
import { Markdown } from "./markdown";
import { ErrorMessage } from "./error-message";
import type { CustomToolRendererProps } from "./types";
import { ToolRowBase } from "./tools/tool-row-base";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { ToolRenderer as DefaultToolRenderer } from "./tools/tool-renderer";
import { normalizeAssistantToolParts } from "./utils/tool-part-normalizer";
import { SpiralLoader } from "./spiral-loader";

export type MessageListProps = {
  messages: UIMessage[];
  status: ChatStatus;
  className?: string;
  showCopyToolbar?: boolean;
  suppressQuestionTool?: boolean;
  /**
   * Where to position the scroll container on initial mount.
   * - "bottom" (default): classic chat behavior, pinned to the latest message.
   * - "top": start from the top of the conversation — useful for static demos
   *   or read-only transcripts where the user should read top-to-bottom.
   */
  initialScrollBehavior?: "bottom" | "top";
  /**
   * When true (default) clicking an attached image in a user message opens
   * the fullscreen lightbox preview. Set to false to disable previews.
   */
  enableImagePreview?: boolean;
  slots?: {
    UserMessage?: React.ComponentType<{
      message: UIMessage;
      className?: string;
      enableImagePreview?: boolean;
    }>;
    ToolRenderer?: React.ComponentType<ToolRendererProps>;
  };
  classNames?: {
    userMessage?: string;
  };
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
};

const SCROLL_THRESHOLD = 80;
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
type ToolPartBase = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  result?: unknown;
};

type ToolRendererProps = {
  part: ToolPartBase;
  nestedTools?: ToolPartBase[];
  chatStatus?: string;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
};

function normalizeMessages(messages: UIMessage[]): UIMessage[] {
  let changed = false;
  const normalized = messages.map((message) => {
    if (Array.isArray(message.parts) && message.parts.length > 0)
      return message;
    const raw = message as { content?: string; text?: string };
    const content = raw.content ?? raw.text;
    if (typeof content !== "string" || !content) return message;
    changed = true;
    return {
      ...message,
      parts: [{ type: "text", text: content }],
    } as UIMessage;
  });
  return changed ? normalized : messages;
}

function getLastAssistantHasContent(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role !== "assistant") continue;
    return (msg.parts ?? []).some((part) => {
      if (isTextPart(part)) return part.text.trim().length > 0;
      return isV5ToolPart(part);
    });
  }
  return false;
}

function getLastUserMessageId(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role === "user") return msg.id;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTextPart(part: unknown): part is { type: "text"; text: string } {
  return (
    isRecord(part) && part.type === "text" && typeof part.text === "string"
  );
}

function isErrorPart(
  part: unknown,
): part is { type: "error"; title?: string; message: string } {
  return (
    isRecord(part) && part.type === "error" && typeof part.message === "string"
  );
}

function isV5ToolPart(part: unknown): part is ToolPartBase {
  if (!isRecord(part)) return false;
  const partType = part.type;
  return (
    partType === "dynamic-tool" ||
    (typeof partType === "string" && partType.startsWith("tool-"))
  );
}

function getTextFromParts(parts: unknown[], joiner: string): string {
  return parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join(joiner);
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isSameDay) {
    return timeFormatter.format(date);
  }
  return dateFormatter.format(date);
}

function CopyButton({
  text,
  onCopied,
}: {
  text: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copiedTimerRef.current) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 2000);
    onCopied?.();
  };
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={handleCopy}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => event.stopPropagation()}
      className={cn(
        "size-6 flex items-center justify-center rounded-md active:scale-[0.97] transition-[background-color,opacity,transform] duration-150 ease-out",
        "opacity-50 bg-transparent hover:opacity-100 hover:bg-an-foreground/10",
      )}
    >
      <div className="relative w-3.5 h-3.5">
        <IconCopy
          className={cn(
            "absolute inset-0 w-3.5 h-3.5 text-an-foreground-muted transition-[opacity,transform] duration-150 ease-out",
            copied ? "opacity-0 scale-50" : "opacity-100 scale-100",
          )}
        />
        <IconCheck
          className={cn(
            "absolute inset-0 w-3.5 h-3.5 text-an-foreground-muted transition-[opacity,transform] duration-150 ease-out",
            copied ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
        />
      </div>
    </button>
  );
}

function MessageToolbar({
  text,
  timestamp,
  heightClass,
  hoverClass,
  isVisible,
  alignClass,
  onCopied,
}: {
  text?: string;
  timestamp?: string;
  heightClass: string;
  hoverClass: string;
  isVisible: boolean;
  alignClass: string;
  onCopied?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 pt-1 text-xs text-an-foreground-muted/70 opacity-0 transition-opacity duration-100 pointer-events-none",
        heightClass,
        alignClass,
        hoverClass,
        isVisible && "opacity-100 pointer-events-auto",
      )}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {timestamp && <span>{timestamp}</span>}
      {text && <CopyButton text={text} onCopied={onCopied} />}
    </div>
  );
}

/** Group flat messages into turns (user message + following assistant messages) */
function groupMessagesIntoTurns(messages: UIMessage[]) {
  const turns: { userMsg?: UIMessage; assistantMsgs: UIMessage[] }[] = [];
  let current: { userMsg?: UIMessage; assistantMsgs: UIMessage[] } | null =
    null;

  for (const msg of messages) {
    if (msg.role === "user") {
      if (current) turns.push(current);
      current = { userMsg: msg, assistantMsgs: [] };
    } else if (msg.role === "assistant") {
      if (!current) current = { assistantMsgs: [] };
      current.assistantMsgs.push(msg);
    }
  }
  if (current) turns.push(current);
  return turns;
}

export const MessageList = memo(function MessageList({
  messages,
  status,
  className,
  showCopyToolbar = true,
  suppressQuestionTool = false,
  initialScrollBehavior = "bottom",
  enableImagePreview = true,
  slots,
  classNames,
  toolRenderers,
}: MessageListProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const chatContainerObserverRef = useRef<ResizeObserver | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevScrollTopRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(
    messages[messages.length - 1]?.id ?? null,
  );
  const assistantSpaceActiveRef = useRef(false);
  const [activeCopyId, setActiveCopyId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const CustomUserMessage = slots?.UserMessage || UserMessage;
  const CustomToolRenderer = slots?.ToolRenderer || DefaultToolRenderer;

  const markCopied = useCallback((id: string) => {
    setActiveCopyId(id);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handlePointerDown = () => {
      setActiveCopyId(null);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const isStreaming = status === "streaming" || status === "submitted";

  const containerRefCallback = useCallback((el: HTMLDivElement | null) => {
    (
      chatContainerRef as React.MutableRefObject<HTMLDivElement | null>
    ).current = el;

    if (chatContainerObserverRef.current) {
      chatContainerObserverRef.current.disconnect();
      chatContainerObserverRef.current = null;
    }
    if (el) {
      el.style.setProperty("--chat-container-height", `${el.clientHeight}px`);
      const observer = new ResizeObserver((entries) => {
        const height = entries[0]?.contentRect.height ?? 0;
        el.style.setProperty("--chat-container-height", `${height}px`);
      });
      observer.observe(el);
      chatContainerObserverRef.current = observer;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (chatContainerObserverRef.current)
        chatContainerObserverRef.current.disconnect();
    };
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  const scrollToBottomSettled = useCallback(() => {
    let rafOne = 0;
    let rafTwo = 0;
    scrollToBottomInstant();
    rafOne = requestAnimationFrame(() => {
      scrollToBottomInstant();
      rafTwo = requestAnimationFrame(() => {
        scrollToBottomInstant();
      });
    });
    return () => {
      cancelAnimationFrame(rafOne);
      cancelAnimationFrame(rafTwo);
    };
  }, [scrollToBottomInstant]);

  const isAtBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      SCROLL_THRESHOLD
    );
  }, []);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const prevScrollTop = prevScrollTopRef.current;
    prevScrollTopRef.current = currentScrollTop;

    if (currentScrollTop < prevScrollTop) {
      shouldAutoScrollRef.current = false;
      return;
    }
    shouldAutoScrollRef.current = isAtBottom();
  }, [isAtBottom]);

  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    const contentWrapper = contentWrapperRef.current;
    if (!container || !contentWrapper) return;

    if (initialScrollBehavior === "top") {
      container.scrollTop = 0;
      shouldAutoScrollRef.current = false;
    } else {
      container.scrollTop = container.scrollHeight;
      shouldAutoScrollRef.current = true;
    }

    let lastContentHeight = contentWrapper.getBoundingClientRect().height;
    let prevScrollHeight = container.scrollHeight;

    const resizeObserver = new ResizeObserver(() => {
      const newContentHeight = contentWrapper.getBoundingClientRect().height;
      if (newContentHeight === lastContentHeight) return;
      lastContentHeight = newContentHeight;

      if (!shouldAutoScrollRef.current) {
        const newScrollHeight = container.scrollHeight;
        if (newScrollHeight !== prevScrollHeight && prevScrollHeight > 0) {
          const delta = newScrollHeight - prevScrollHeight;
          container.scrollTop = container.scrollTop + delta;
        }
      }
      prevScrollHeight = container.scrollHeight;
    });

    resizeObserver.observe(contentWrapper);
    return () => resizeObserver.disconnect();
  }, []);

  const normalizedMessages = useMemo(
    () => normalizeMessages(messages),
    [messages],
  );
  const lastMessage = normalizedMessages[normalizedMessages.length - 1];
  const lastMessageId = lastMessage?.id ?? null;
  const lastMessageRole = lastMessage?.role ?? null;
  const lastUserMessageId = useMemo(
    () => getLastUserMessageId(normalizedMessages),
    [normalizedMessages],
  );

  const lastUserMessageIdRef = useRef(lastUserMessageId);
  const pendingPlanningScrollUserIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (
      lastUserMessageId &&
      lastUserMessageId !== lastUserMessageIdRef.current
    ) {
      shouldAutoScrollRef.current = true;
      pendingPlanningScrollUserIdRef.current = lastUserMessageId;
      const cancel = scrollToBottomSettled();
      lastUserMessageIdRef.current = lastUserMessageId;
      return cancel;
    }
  }, [lastUserMessageId, scrollToBottomSettled]);

  const planningLabel = "Processing...";
  const turns = useMemo(
    () => groupMessagesIntoTurns(normalizedMessages),
    [normalizedMessages],
  );
  const showPlanning = useMemo(() => {
    const lastMessage = normalizedMessages[normalizedMessages.length - 1];
    if (!lastMessage) return false;
    const lastTurn = turns[turns.length - 1];
    const hasAssistant = Boolean(lastTurn && lastTurn.assistantMsgs.length > 0);
    if (lastMessage.role === "user" && !hasAssistant) return true;
    return isStreaming && !getLastAssistantHasContent(normalizedMessages);
  }, [isStreaming, normalizedMessages, turns]);
  const isNewAssistantMessage =
    lastMessageRole === "assistant" &&
    Boolean(lastMessageId) &&
    lastMessageId !== lastMessageIdRef.current;
  const showAssistantBreathingSpace =
    showPlanning || assistantSpaceActiveRef.current || isNewAssistantMessage;

  useEffect(() => {
    if (lastMessageRole === "assistant") {
      if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
        assistantSpaceActiveRef.current = true;
      }
    }
    if (lastMessageRole === "user") {
      assistantSpaceActiveRef.current = false;
    }
    lastMessageIdRef.current = lastMessageId;
  }, [lastMessageId, lastMessageRole]);

  useLayoutEffect(() => {
    if (!showPlanning || !lastUserMessageId) return;
    if (pendingPlanningScrollUserIdRef.current !== lastUserMessageId) return;
    const cancel = scrollToBottomSettled();
    pendingPlanningScrollUserIdRef.current = null;
    return cancel;
  }, [lastUserMessageId, showPlanning, scrollToBottomSettled]);

  return (
    <div
      ref={containerRefCallback}
      onScroll={handleScroll}
      className={cn(
        "an-message-list flex-1 min-h-0 overflow-y-auto",
        className,
      )}
    >
      <div ref={contentWrapperRef} className="mx-auto px-4 py-6 max-w-an">
        <div className="space-y-2">
          {turns.map((turn, turnIndex) => {
            const isLastTurn = turnIndex === turns.length - 1;
            const turnKey = turn.userMsg?.id ?? `turn-${turnIndex}`;

            return (
              <div key={turnKey} className="relative space-y-2">
                {turn.userMsg &&
                  (() => {
                    const text = getTextFromParts(
                      turn.userMsg!.parts ?? [],
                      "",
                    );
                    const hasParts = (turn.userMsg!.parts ?? []).length > 0;
                    if (!text && !hasParts) return null;
                    const userCreatedAt = (
                      turn.userMsg as { createdAt?: Date | string }
                    )?.createdAt;
                    const userCopyKey = `user-${turn.userMsg.id}`;
                    const userCopyVisible = activeCopyId === userCopyKey;
                    const userTimestamp =
                      isMounted && userCreatedAt
                        ? formatTimestamp(new Date(userCreatedAt))
                        : undefined;
                    // Only render the toolbar when it has content — copy
                    // button (gated by showCopyToolbar) or a timestamp.
                    // Otherwise a 28px-tall empty row inflates the gap to the
                    // assistant reply.
                    const showUserToolbar =
                      (showCopyToolbar && Boolean(text)) ||
                      Boolean(userTimestamp);
                    return (
                      <div className="group/user-message">
                        <CustomUserMessage
                          message={turn.userMsg}
                          className={classNames?.userMessage}
                          enableImagePreview={enableImagePreview}
                        />
                        {showUserToolbar && (
                          <MessageToolbar
                            text={showCopyToolbar ? text : ""}
                            timestamp={userTimestamp}
                            heightClass="h-[28px]"
                            hoverClass="group-hover/user-message:opacity-100 group-hover/user-message:pointer-events-auto"
                            isVisible={userCopyVisible}
                            alignClass="justify-end"
                            onCopied={() => markCopied(userCopyKey)}
                          />
                        )}
                      </div>
                    );
                  })()}

                {turn.assistantMsgs.length > 0 &&
                  !(isLastTurn && showPlanning) &&
                  (() => {
                    const assistantText = getTextFromParts(
                      turn.assistantMsgs.flatMap((msg) => msg.parts ?? []),
                      "\n\n",
                    );
                    const isTurnStreaming = isStreaming && isLastTurn;
                    // Only reserve toolbar height when there's actually
                    // something to show in it. With showCopyToolbar=false the
                    // toolbar would otherwise render as a 48px-tall empty box,
                    // creating large gaps between assistant turns.
                    const showToolbar =
                      showCopyToolbar &&
                      Boolean(assistantText.trim()) &&
                      !isTurnStreaming;
                    const copyKey = `assistant-${turnKey}-all`;
                    const toolbarText = showCopyToolbar ? assistantText : "";

                    return (
                      <div className="group/assistant-turn">
                        <div className="flex flex-col gap-3">
                          {turn.assistantMsgs.map((msg, i) => {
                            const isLastMsg =
                              isLastTurn && i === turn.assistantMsgs.length - 1;
                            return (
                              <AssistantParts
                                key={msg.id}
                                msg={msg}
                                isLast={isLastMsg}
                                isStreaming={isStreaming}
                                suppressQuestionTool={suppressQuestionTool}
                                ToolRendererComponent={CustomToolRenderer}
                                toolRenderers={toolRenderers}
                              />
                            );
                          })}
                        </div>
                        {showToolbar ? (
                          <MessageToolbar
                            text={toolbarText}
                            heightClass="h-[48px] flex items-start w-full"
                            hoverClass="group-hover/assistant-turn:opacity-100 group-hover/assistant-turn:pointer-events-auto"
                            isVisible={activeCopyId === copyKey}
                            alignClass="justify-start"
                            onCopied={() => markCopied(copyKey)}
                          />
                        ) : activeCopyId === copyKey ? (
                          <MessageToolbar
                            text={toolbarText}
                            heightClass="h-[48px] flex items-start w-full"
                            hoverClass="group-hover/assistant-turn:opacity-100 group-hover/assistant-turn:pointer-events-auto"
                            isVisible={true}
                            alignClass="justify-start"
                            onCopied={() => markCopied(copyKey)}
                          />
                        ) : null}
                      </div>
                    );
                  })()}

                {isLastTurn && showPlanning && (
                  <ToolRowBase
                    icon={<SpiralLoader size={12} />}
                    shimmerLabel={planningLabel}
                    completeLabel="Done"
                    isAnimating={true}
                  />
                )}
              </div>
            );
          })}
        </div>
        {showAssistantBreathingSpace && (
          <div
            aria-hidden="true"
            className="min-h-[max(140px,24vh)] mx-auto max-w-an w-full"
          />
        )}
      </div>
    </div>
  );
});

function AssistantParts({
  msg,
  isLast,
  isStreaming,
  suppressQuestionTool,
  ToolRendererComponent,
  toolRenderers,
}: {
  msg: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
  suppressQuestionTool: boolean;
  ToolRendererComponent: React.ComponentType<ToolRendererProps>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
}) {
  const parts = useMemo(
    () => normalizeAssistantToolParts(msg.parts ?? []) as unknown[],
    [msg.parts],
  );

  const { elements } = useMemo(() => {
    const elems: React.ReactNode[] = [];
    const taskPartIds = new Set(
      parts
        .filter(
          (p): p is ToolPartBase =>
            isV5ToolPart(p) &&
            (p.type === "tool-Task" || p.type === "tool-Agent") &&
            typeof p.toolCallId === "string",
        )
        .map((p) => p.toolCallId!),
    );
    const nestedToolsMap = new Map<string, ToolPartBase[]>();
    const nestedToolIds = new Set<string>();

    for (const part of parts) {
      if (!isV5ToolPart(part)) continue;
      if (part.type === "tool-TaskOutput") continue;
      if (!part.toolCallId || !part.toolCallId.includes(":")) continue;
      const parentId = part.toolCallId.split(":")[0];
      if (!taskPartIds.has(parentId)) continue;
      if (!nestedToolsMap.has(parentId)) {
        nestedToolsMap.set(parentId, []);
      }
      nestedToolsMap.get(parentId)!.push(part);
      nestedToolIds.add(part.toolCallId);
    }

    let i = 0;
    while (i < parts.length) {
      const part = parts[i]!;

      if (isV5ToolPart(part) && part.type === "tool-TaskOutput") {
        i++;
        continue;
      }

      if (isTextPart(part)) {
        const text = part.text;
        if (text) {
          elems.push(
            <div
              key={`${msg.id}-text-${i}`}
              className="group/assistant-text text-[14px]"
            >
              <Markdown
                content={text}
                className="leading-relaxed [&_p]:leading-relaxed"
              />
            </div>,
          );
        }
        i++;
        continue;
      }

      if (isErrorPart(part)) {
        elems.push(
          <ErrorMessage
            key={`${msg.id}-error-${i}`}
            title={part.title}
            message={part.message}
          />,
        );
        i++;
        continue;
      }

      if (isV5ToolPart(part)) {
        if (suppressQuestionTool && part.type === "tool-Question") {
          i++;
          continue;
        }
        if (part.toolCallId && nestedToolIds.has(part.toolCallId)) {
          i++;
          continue;
        }

        const chatStreamingStatus =
          isLast && isStreaming ? "streaming" : undefined;
        const toolCallId = part.toolCallId;
        const nestedTools =
          (part.type === "tool-Task" || part.type === "tool-Agent") &&
          toolCallId
            ? nestedToolsMap.get(toolCallId) || []
            : undefined;
        elems.push(
          <ToolRendererComponent
            key={part.toolCallId ?? `${msg.id}-tool-${i}`}
            part={part}
            nestedTools={nestedTools}
            chatStatus={chatStreamingStatus}
            toolRenderers={toolRenderers}
          />,
        );
        i++;
        continue;
      }

      i++;
    }

    return { elements: elems };
  }, [
    parts,
    msg.id,
    isLast,
    isStreaming,
    suppressQuestionTool,
    ToolRendererComponent,
    toolRenderers,
  ]);

  if (elements.length > 1) {
    return (
      <div className="group/assistant-turn flex flex-col gap-3">{elements}</div>
    );
  }

  return <div className="group/assistant-turn">{elements}</div>;
}
