"use client";

import { useRef, useState } from "react";
import { MessageList } from "./message-list";
import { InputBar } from "./input-bar";
import { Suggestions, type SuggestionItem } from "./input/suggestions";
import { cn } from "./utils/cn";
import type { AgentChatProps } from "./types";

export function AgentChat({
  messages,
  onSend,
  status,
  onStop,
  error,
  classNames,
  slots,
  toolRenderers,
  attachments,
  showCopyToolbar,
  initialScrollBehavior,
  enableImagePreview,
  suggestions,
  emptyStatePosition = "default",
  emptySuggestionsPlacement = "input",
  emptySuggestionsPosition = "top",
  questionTool,
  className,
  style,
}: AgentChatProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const ResolvedInputBar = slots?.InputBar ?? InputBar;
  const isEmpty = !error && messages.length === 0;
  const isCenteredEmptyState = isEmpty && emptyStatePosition === "center";

  const pendingQuestion = findPendingQuestion(messages, questionTool);
  const suggestionConfig = resolveSuggestions(suggestions);
  const showInputSuggestions =
    emptySuggestionsPlacement === "input" ||
    emptySuggestionsPlacement === "both";
  const showEmptySuggestions =
    isCenteredEmptyState &&
    (emptySuggestionsPlacement === "empty" ||
      emptySuggestionsPlacement === "both") &&
    suggestionConfig.items.length > 0;

  const handleEmptySuggestionSelect = (item: SuggestionItem) => {
    setDraft(item.value ?? item.label);
  };

  const emptySuggestionsNode = showEmptySuggestions ? (
    <Suggestions
      items={suggestionConfig.items}
      onSelect={handleEmptySuggestionSelect}
      disabled={status === "streaming" || status === "submitted"}
      className={cn(
        "w-full justify-center",
        emptySuggestionsPosition === "top" ? "mb-3" : "mt-3",
        suggestionConfig.className,
      )}
      itemClassName={cn("h-8 rounded-md px-3", suggestionConfig.itemClassName)}
    />
  ) : null;

  const inputBarNode = (
    <ResolvedInputBar
      onSend={onSend}
      status={status}
      onStop={onStop}
      value={draft}
      onChange={setDraft}
      placeholder="Send a message..."
      className={cn(classNames?.inputBar, isCenteredEmptyState && "px-0 pb-0")}
      onAttach={attachments?.onAttach}
      attachedImages={attachments?.images}
      attachedFiles={attachments?.files}
      onRemoveImage={attachments?.onRemoveImage}
      onRemoveFile={attachments?.onRemoveFile}
      onPaste={attachments?.onPaste}
      isDragOver={attachments?.isDragOver}
      suggestions={showInputSuggestions ? suggestions : []}
      questionBar={
        pendingQuestion
          ? {
              id: pendingQuestion.id,
              questions: pendingQuestion.questions,
              questionIndex: pendingQuestion.questionIndex,
              totalQuestions: pendingQuestion.totalQuestions,
              onPreviousQuestion: pendingQuestion.onPreviousQuestion,
              onNextQuestion: pendingQuestion.onNextQuestion,
              submitLabel: pendingQuestion.submitLabel,
              skipLabel: pendingQuestion.skipLabel,
              allowSkip: pendingQuestion.allowSkip,
              onSubmit: (answer) => {
                questionTool?.onAnswer?.({
                  toolCallId: pendingQuestion.toolCallId,
                  question:
                    pendingQuestion.questions[
                      pendingQuestion.questionIndex
                        ? pendingQuestion.questionIndex - 1
                        : 0
                    ],
                  answer,
                });
              },
            }
          : undefined
      }
    />
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex flex-col h-full min-h-0",
        classNames?.root,
        className,
      )}
      style={style}
    >
      {isCenteredEmptyState ? (
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-an">
            {emptySuggestionsPosition === "top" ? emptySuggestionsNode : null}
            {inputBarNode}
            {emptySuggestionsPosition === "bottom"
              ? emptySuggestionsNode
              : null}
          </div>
        </div>
      ) : (
        <MessageList
          messages={
            error
              ? [
                  ...messages,
                  {
                    id: "agent-chat-error",
                    role: "assistant",
                    parts: [
                      {
                        type: "error",
                        title: "Request failed",
                        message: error.message,
                      },
                    ],
                  } as unknown as (typeof messages)[number],
                ]
              : messages
          }
          status={status}
          classNames={classNames}
          slots={slots}
          toolRenderers={toolRenderers}
          showCopyToolbar={showCopyToolbar}
          initialScrollBehavior={initialScrollBehavior}
          enableImagePreview={enableImagePreview}
          suppressQuestionTool={Boolean(pendingQuestion)}
        />
      )}
      {!isCenteredEmptyState ? inputBarNode : null}
    </div>
  );
}

function resolveSuggestions(suggestions: AgentChatProps["suggestions"]) {
  if (Array.isArray(suggestions)) {
    return {
      items: suggestions,
      className: undefined,
      itemClassName: undefined,
    };
  }
  return {
    items: suggestions?.items ?? [],
    className: suggestions?.className,
    itemClassName: suggestions?.itemClassName,
  };
}

function findPendingQuestion(
  messages: AgentChatProps["messages"],
  questionTool: AgentChatProps["questionTool"],
) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;
    const parts = message.parts ?? [];
    for (let p = parts.length - 1; p >= 0; p -= 1) {
      const part = parts[p] as {
        type?: string;
        toolCallId?: string;
        input?: {
          questions?: import("./question/question-prompt").QuestionConfig[];
          question?: import("./question/question-prompt").QuestionConfig;
          questionIndex?: number;
          totalQuestions?: number;
          onPreviousQuestion?: () => void;
          onNextQuestion?: () => void;
          submitLabel?: string;
          skipLabel?: string;
          allowSkip?: boolean;
        };
        output?: {
          answer?: import("./question/question-prompt").QuestionAnswer;
        };
      };
      if (part?.type !== "tool-Question") continue;
      const input = part.input;
      const questions = input?.questions ?? [];
      const firstQuestion = questions[0] ?? input?.question;
      if (!firstQuestion) continue;
      if (part.output?.answer) return null;
      return {
        id: part.toolCallId ?? `question-${i}-${p}`,
        toolCallId: part.toolCallId,
        questions,
        question: firstQuestion,
        questionIndex: input?.questionIndex,
        totalQuestions:
          input?.totalQuestions ??
          (questions.length > 0 ? questions.length : undefined),
        onPreviousQuestion: input?.onPreviousQuestion,
        onNextQuestion: input?.onNextQuestion,
        submitLabel: questionTool?.submitLabel ?? input?.submitLabel,
        skipLabel: questionTool?.skipLabel ?? input?.skipLabel,
        allowSkip: questionTool?.allowSkip ?? input?.allowSkip,
      };
    }
  }
  return null;
}

// Legacy component alias kept for compatibility.
export const AnAgentChat = AgentChat;
