import { useEffect, useMemo, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconMessageCircleQuestion,
} from "@tabler/icons-react";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionAnswer, QuestionConfig } from "./question-prompt";

export type QuestionToolPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: {
    questions: QuestionConfig[];
    questionIndex?: number;
    totalQuestions?: number;
    onPreviousQuestion?: () => void;
    onNextQuestion?: () => void;
    submitLabel?: string;
    nextLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    onSubmitAnswer?: (answer: QuestionAnswer) => void;
  };
  output?: {
    answer?: QuestionAnswer;
  };
};

export type QuestionToolProps = {
  part: QuestionToolPart;
  chatStatus?: string;
};

function formatAnswer(answer: QuestionAnswer) {
  if (answer.kind === "skip") return "Skipped";
  if (answer.kind === "text") return answer.text || "Answered";
  const ids = answer.selectedIds?.length ? answer.selectedIds.join(", ") : "";
  if (answer.text) return ids ? `${ids} (${answer.text})` : answer.text;
  return ids || "Answered";
}

export function QuestionTool({ part }: QuestionToolProps) {
  const [localIndex, setLocalIndex] = useState(part.input?.questionIndex ?? 1);
  const questions: QuestionConfig[] = part.input?.questions ?? [];
  const totalQuestions = part.input?.totalQuestions ?? questions.length;
  const isControlled = typeof part.input?.questionIndex === "number";
  const questionIndex = isControlled
    ? (part.input?.questionIndex ?? 1)
    : questions.length > 0
      ? localIndex
      : (part.input?.questionIndex ?? 1);
  const clampedIndex = Math.max(1, Math.min(questionIndex, totalQuestions));
  const question = questions[clampedIndex - 1];
  const [localAnswers, setLocalAnswers] = useState<
    Record<number, QuestionAnswer>
  >({});

  useEffect(() => {
    if (typeof part.input?.questionIndex === "number") {
      setLocalIndex(part.input.questionIndex);
    }
  }, [part.input?.questionIndex]);

  useEffect(() => {
    setLocalAnswers({});
    setLocalIndex(part.input?.questionIndex ?? 1);
  }, [part.toolCallId]);

  if (!question) return null;

  const outputAnswer = part.output?.answer;
  const answeredCount = Object.keys(localAnswers).length;
  const isComplete =
    totalQuestions === 1
      ? !!outputAnswer || answeredCount >= 1
      : totalQuestions > 0 && answeredCount >= totalQuestions;
  const showNavigation = totalQuestions > 1 && !isComplete;
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < totalQuestions;
  const summaryAnswers = useMemo(() => {
    if (!isComplete || totalQuestions <= 1) return [];
    return Array.from({ length: totalQuestions }, (_, idx) => ({
      index: idx + 1,
      answer: localAnswers[idx + 1],
    }));
  }, [isComplete, localAnswers, totalQuestions]);
  const summaryText = useMemo(() => {
    if (!isComplete) return "";
    if (summaryAnswers.length > 0) {
      return summaryAnswers
        .map(
          (item) =>
            `${item.index}: ${item.answer ? formatAnswer(item.answer) : "Pending"}`,
        )
        .join(" • ");
    }
    if (outputAnswer) return formatAnswer(outputAnswer);
    if (localAnswers[clampedIndex])
      return formatAnswer(localAnswers[clampedIndex]);
    return "Pending";
  }, [isComplete, summaryAnswers, outputAnswer, localAnswers, clampedIndex]);

  const goPrev = () => {
    if (!canGoPrev) return;
    part.input?.onPreviousQuestion?.();
    if (!isControlled) {
      setLocalIndex((prev) => Math.max(1, prev - 1));
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    part.input?.onNextQuestion?.();
    if (!isControlled) {
      setLocalIndex((prev) => Math.min(totalQuestions, prev + 1));
    }
  };

  return (
    <div className="rounded-an-tool-border-radius border border-border bg-an-tool-background overflow-hidden">
      <div className="h-7 border-b border-border px-3 flex items-center justify-between text-xs text-an-tool-color-muted">
        <div className="inline-flex items-center gap-1.5">
          <IconMessageCircleQuestion className="w-3.5 h-3.5" />
          Question
        </div>
        {showNavigation && (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="size-5 inline-flex items-center justify-center rounded-[4px] hover:bg-an-background-secondary disabled:opacity-40"
              aria-label="Previous question"
            >
              <IconChevronUp className="w-3.5 h-3.5" />
            </button>
            <span>
              {clampedIndex} of {totalQuestions}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="size-5 inline-flex items-center justify-center rounded-[4px] hover:bg-an-background-secondary disabled:opacity-40"
              aria-label="Next question"
            >
              <IconChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isComplete ? (
        <div className="px-3 py-2 text-xs text-an-tool-color-muted bg-background">
          {summaryText}
        </div>
      ) : (
        <QuestionPrompt
          key={`${clampedIndex}-${question.title}`}
          questions={questions}
          questionIndex={clampedIndex}
          totalQuestions={totalQuestions}
          initialAnswer={localAnswers[clampedIndex]}
          submitLabel={part.input?.submitLabel}
          nextLabel={part.input?.nextLabel}
          skipLabel={part.input?.skipLabel}
          allowSkip={part.input?.allowSkip}
          onSubmit={(nextAnswer) => {
            setLocalAnswers((prev) => ({
              ...prev,
              [clampedIndex]: nextAnswer,
            }));
            part.input?.onSubmitAnswer?.(nextAnswer);
            if (clampedIndex < totalQuestions) {
              goNext();
            }
          }}
        />
      )}
    </div>
  );
}
