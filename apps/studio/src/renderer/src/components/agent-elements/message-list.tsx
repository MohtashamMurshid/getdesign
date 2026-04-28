import type { UIMessage } from "ai";

type MessageListProps = {
  messages: UIMessage[];
  emptyState?: React.ReactNode;
};

export function MessageList({ messages, emptyState }: MessageListProps) {
  if (messages.length === 0) {
    return <div className="ae-empty">{emptyState}</div>;
  }

  return (
    <div className="ae-message-list">
      {messages.map((message) => (
        <article className={`ae-message ae-message-${message.role}`} key={message.id}>
          <div className="ae-message-role">{message.role === "user" ? "You" : "Studio"}</div>
          <div className="ae-message-content">{getMessageText(message)}</div>
        </article>
      ))}
    </div>
  );
}

function getMessageText(message: UIMessage): string {
  if ("parts" in message && Array.isArray(message.parts)) {
    return message.parts
      .map((part) => {
        if (part.type === "text") return part.text;
        return "";
      })
      .join("");
  }

  return "";
}
