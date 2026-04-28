import { FormEvent, ReactNode, useState } from "react";
import type { ChatStatus } from "ai";

type InputBarProps = {
  status: ChatStatus;
  onSend: (input: { content: string }) => void;
  onStop: () => void;
  value?: string;
  onChange?: (value: string) => void;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  infoBar?: ReactNode;
  disabled?: boolean;
};

export function InputBar({
  status,
  onSend,
  onStop,
  value,
  onChange,
  leftActions,
  rightActions,
  infoBar,
  disabled,
}: InputBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = value ?? internalValue;
  const isBusy = status === "submitted" || status === "streaming";

  function updateValue(nextValue: string) {
    if (onChange) {
      onChange(nextValue);
    } else {
      setInternalValue(nextValue);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = currentValue.trim();
    if (!content || disabled || isBusy) return;
    onSend({ content });
    updateValue("");
  }

  return (
    <form className="ae-input-bar" onSubmit={handleSubmit}>
      {infoBar ? <div className="ae-info-bar">{infoBar}</div> : null}
      <div className="ae-input-actions">{leftActions}</div>
      <textarea
        className="ae-textarea"
        value={currentValue}
        onChange={(event) => updateValue(event.target.value)}
        placeholder="Ask Studio to plan a deck, refine a narrative, or discuss a slide direction..."
        rows={3}
        disabled={disabled}
      />
      <div className="ae-input-footer">
        <div className="ae-input-actions">{rightActions}</div>
        {isBusy ? (
          <button className="ae-button ae-button-secondary" type="button" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button className="ae-button" type="submit" disabled={disabled || !currentValue.trim()}>
            Send
          </button>
        )}
      </div>
    </form>
  );
}
