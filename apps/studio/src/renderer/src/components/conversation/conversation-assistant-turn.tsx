import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Streamdown } from "streamdown";

import type { StudioMessage } from "../../../../shared/studio-api";
import { cn } from "@/lib/utils";

import { PiToolRow } from "./conversation-pi-tool-row";
import { ThinkingBlock } from "./conversation-thinking";
import {
  getCopyText,
  getRenderableParts,
  getToolName,
  isTextPart,
  isToolPart,
} from "./conversation-utils";

export const AssistantTurn = memo(function AssistantTurn({
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
          if (getToolName(part) === "Thinking") {
            return (
              <ThinkingBlock
                key={part.toolCallId ?? `${message.id}-thinking-${index}`}
                part={part}
                isStreaming={isStreaming}
              />
            );
          }
          return (
            <PiToolRow
              key={part.toolCallId ?? `${message.id}-tool-${index}`}
              part={part}
            />
          );
        }
        return null;
      })}
      {isStreaming && parts.length > 0 ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-foreground align-text-bottom"
        />
      ) : null}
      {!isStreaming && copyText.length > 0 ? (
        <CopyButton text={copyText} />
      ) : null}
      {isError ? (
        <p className="mt-1 text-xs text-destructive">
          Generation failed. Try again.
        </p>
      ) : null}
    </div>
  );
});

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
