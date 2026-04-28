import type { ChatStatus, UIMessage } from "ai";
import { InputBar } from "./input-bar";
import { MessageList } from "./message-list";

type AgentChatProps = {
  messages: UIMessage[];
  status: ChatStatus;
  onSend: (input: { content: string }) => void;
  onStop: () => void;
  suggestions?: string[];
  classNames?: {
    root?: string;
  };
  slots?: {
    leftActions?: React.ReactNode;
    rightActions?: React.ReactNode;
    infoBar?: React.ReactNode;
    emptyState?: React.ReactNode;
  };
  disabled?: boolean;
};

export function AgentChat({
  messages,
  status,
  onSend,
  onStop,
  suggestions,
  classNames,
  slots,
  disabled,
}: AgentChatProps) {
  return (
    <section className={["ae-chat", classNames?.root].filter(Boolean).join(" ")}>
      <MessageList
        messages={messages}
        emptyState={
          slots?.emptyState ?? (
            <div>
              <p className="ae-empty-title">Start a Studio conversation</p>
              <p className="ae-empty-copy">
                Authenticate a Pi provider, choose a model, then ask for a deck plan.
              </p>
              {suggestions?.length ? (
                <div className="ae-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      className="ae-suggestion"
                      key={suggestion}
                      type="button"
                      onClick={() => onSend({ content: suggestion })}
                      disabled={disabled}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        }
      />
      <InputBar
        status={status}
        onSend={onSend}
        onStop={onStop}
        leftActions={slots?.leftActions}
        rightActions={slots?.rightActions}
        infoBar={slots?.infoBar}
        disabled={disabled}
      />
    </section>
  );
}
