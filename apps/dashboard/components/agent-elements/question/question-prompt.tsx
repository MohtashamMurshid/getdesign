import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
};

export type QuestionConfig = {
  kind: "single" | "multi" | "text";
  title: string;
  description?: string;
  options?: QuestionOption[];
  allowCustom?: boolean;
  customLabel?: string;
  customPlaceholder?: string;
  minSelections?: number;
  maxSelections?: number;
  placeholder?: string;
};

export type QuestionAnswer = {
  kind: "single" | "multi" | "text" | "skip";
  selectedIds?: string[];
  text?: string;
};

const QUESTION_CUSTOM_ID = "__custom__";

function optionBadge(idx: number) {
  return String.fromCharCode(65 + idx);
}

export type QuestionPromptProps = {
  questions: QuestionConfig[];
  questionIndex?: number;
  totalQuestions?: number;
  onPreviousQuestion?: () => void;
  onNextQuestion?: () => void;
  initialAnswer?: QuestionAnswer;
  /** Label for the primary action on the LAST question (default "Send"). */
  submitLabel?: string;
  /** Label for the primary action when there are more questions ahead
   *  (default "Next"). The host (e.g. QuestionTool) is expected to advance
   *  to the next question after onSubmit fires. */
  nextLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
  onSubmit: (answer: QuestionAnswer) => void;
  onSkip?: () => void;
  className?: string;
};

export function QuestionPrompt({
  questions,
  questionIndex = 1,
  totalQuestions,
  onPreviousQuestion,
  onNextQuestion,
  submitLabel = "Send",
  nextLabel = "Next",
  skipLabel = "Skip",
  allowSkip = true,
  initialAnswer,
  onSubmit,
  onSkip,
  className,
}: QuestionPromptProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [textValue, setTextValue] = useState("");
  const resolvedTotal = totalQuestions ?? questions.length;
  const clampedIndex = Math.max(1, Math.min(questionIndex, resolvedTotal));
  const activeQuestion = questions[clampedIndex - 1];
  const customEnabled = activeQuestion?.allowCustom ?? false;
  const showNav =
    resolvedTotal > 1 && (!!onPreviousQuestion || !!onNextQuestion);
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < resolvedTotal;
  const isLastQuestion = clampedIndex >= resolvedTotal;
  const primaryLabel = isLastQuestion ? submitLabel : nextLabel;

  useEffect(() => {
    if (!initialAnswer || initialAnswer.kind === "skip") {
      setSelectedIds([]);
      setCustomText("");
      setTextValue("");
      return;
    }

    if (activeQuestion?.kind === "text") {
      setSelectedIds([]);
      setCustomText("");
      setTextValue(initialAnswer.text ?? "");
      return;
    }

    const nextSelected = new Set(initialAnswer.selectedIds ?? []);
    const nextCustomText = initialAnswer.text ?? "";
    if (customEnabled && nextCustomText.trim().length > 0) {
      nextSelected.add(QUESTION_CUSTOM_ID);
    }
    setSelectedIds(Array.from(nextSelected));
    setCustomText(nextCustomText);
    setTextValue("");
  }, [
    activeQuestion?.kind,
    clampedIndex,
    customEnabled,
    initialAnswer?.kind,
    initialAnswer?.text,
    initialAnswer?.selectedIds?.join("|"),
  ]);

  const canSubmit = useMemo(() => {
    if (activeQuestion?.kind === "text") return textValue.trim().length > 0;

    const selectedNonCustom = selectedIds.filter(
      (id) => id !== QUESTION_CUSTOM_ID,
    ).length;
    const hasCustomText = customText.trim().length > 0;
    const total = selectedNonCustom + (hasCustomText ? 1 : 0);

    if (activeQuestion?.kind === "single") {
      return total === 1;
    }

    const min = activeQuestion?.minSelections ?? 1;
    const max = activeQuestion?.maxSelections;
    if (total < min) return false;
    if (typeof max === "number" && total > max) return false;
    return total > 0;
  }, [
    activeQuestion?.kind,
    activeQuestion?.minSelections,
    activeQuestion?.maxSelections,
    selectedIds,
    customText,
    textValue,
  ]);

  const toggleMulti = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSingleSelect = (id: string) => {
    setSelectedIds([id]);
  };

  const handleCustomTextChange = (nextValue: string) => {
    setCustomText(nextValue);
    if (!activeQuestion) return;
    if (activeQuestion.kind === "single") {
      setSelectedIds(nextValue.trim().length > 0 ? [QUESTION_CUSTOM_ID] : []);
      return;
    }
    setSelectedIds((prev) => {
      const hasCustom = prev.includes(QUESTION_CUSTOM_ID);
      if (nextValue.trim().length > 0 && !hasCustom) {
        return [...prev, QUESTION_CUSTOM_ID];
      }
      if (nextValue.trim().length === 0 && hasCustom) {
        return prev.filter((id) => id !== QUESTION_CUSTOM_ID);
      }
      return prev;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || !activeQuestion) return;
    if (activeQuestion.kind === "text") {
      onSubmit({ kind: "text", text: textValue.trim() });
      return;
    }

    const selectedNonCustom = selectedIds.filter(
      (id) => id !== QUESTION_CUSTOM_ID,
    );
    const answerText = customText.trim() || undefined;
    onSubmit({
      kind: activeQuestion.kind,
      selectedIds: selectedNonCustom,
      text: answerText || undefined,
    });
  };

  const handleSkip = () => {
    onSkip?.();
    onSubmit({ kind: "skip" });
  };

  if (!activeQuestion) return null;

  return (
    <div className={cn("px-3 py-2 space-y-2 bg-background", className)}>
      <div
        className="flex items-center justify-between gap-px"
        data-total-questions={resolvedTotal}
      >
        <div className="flex items-center gap-2 text-sm text-an-tool-color">
          <span className="h-5 min-w-5 px-1 rounded-[4px] inline-flex items-center justify-center text-sm font-medium text-an-tool-color-muted">
            {clampedIndex}
          </span>
          <span>{activeQuestion.title}</span>
        </div>
      </div>

      {activeQuestion.kind !== "text" &&
        (activeQuestion.options?.length ?? 0) > 0 && (
          <div className="space-y-px">
            {activeQuestion.options!.map((option, idx) => {
              const checked = selectedIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (activeQuestion.kind === "single") {
                      handleSingleSelect(option.id);
                      if (customEnabled) setCustomText("");
                    } else {
                      toggleMulti(option.id);
                    }
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 flex items-center gap-2 hover:bg-an-background-secondary -mx-2"
                >
                  <span
                    className={cn(
                      "h-5 min-w-5 px-1 rounded-[4px] inline-flex items-center justify-center text-sm font-medium border",
                      checked
                        ? "bg-an-primary-color text-an-send-button-color border-an-primary-color"
                        : "bg-transparent text-an-tool-color-muted border-border",
                    )}
                  >
                    {optionBadge(idx)}
                  </span>
                  <span className="text-sm text-an-tool-color">
                    {option.label}
                    {option.description && (
                      <span className="text-an-tool-color-muted">
                        {" "}
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            {customEnabled && (
              <div className="pt-1 flex items-center gap-2">
                <span
                  className={cn(
                    "h-5 min-w-5 px-1 rounded-[4px] inline-flex items-center justify-center text-sm font-medium border",
                    selectedIds.includes(QUESTION_CUSTOM_ID)
                      ? "bg-an-primary-color text-an-send-button-color border-an-primary-color"
                      : "bg-transparent text-an-tool-color-muted border-border",
                  )}
                >
                  {optionBadge(activeQuestion.options!.length)}
                </span>
                <input
                  value={customText}
                  onChange={(event) =>
                    handleCustomTextChange(event.target.value)
                  }
                  placeholder={
                    activeQuestion.customPlaceholder ?? "Type your answer"
                  }
                  className="w-full h-7 rounded-md border border-border bg-background px-2 text-sm text-an-tool-color"
                />
              </div>
            )}
          </div>
        )}

      {activeQuestion.kind === "text" && (
        <textarea
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
          placeholder={activeQuestion.placeholder ?? "Type your answer"}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-an-tool-color resize-y"
        />
      )}

      <div
        className={cn(
          "flex items-center gap-1.5",
          showNav ? "justify-between" : "justify-end",
        )}
      >
        {showNav && (
          <div className="flex items-center gap-1.5">
            {onPreviousQuestion && (
              <button
                type="button"
                onClick={onPreviousQuestion}
                disabled={!canGoPrev}
                className="h-6 px-2 rounded-[4px] text-sm text-muted-foreground hover:text-an-tool-color disabled:opacity-60"
              >
                Previous
              </button>
            )}
            {onNextQuestion && (
              <button
                type="button"
                onClick={onNextQuestion}
                disabled={!canGoNext}
                className="h-6 px-2 rounded-[4px] text-sm text-muted-foreground hover:text-an-tool-color disabled:opacity-60"
              >
                Next
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-end gap-1.5">
          {allowSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="h-6 px-2 rounded-[4px] text-sm text-muted-foreground hover:text-an-tool-color hover:bg-muted/50 active:scale-[0.98] transition-[background-color,color,transform] duration-150"
            >
              {skipLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-6 px-2.5 rounded-[4px] text-sm font-medium bg-an-primary-color text-an-send-button-color hover:bg-an-primary-color/90 active:scale-[0.98] transition-[background-color,transform] duration-150 disabled:opacity-60 disabled:hover:bg-an-primary-color disabled:active:scale-100"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
