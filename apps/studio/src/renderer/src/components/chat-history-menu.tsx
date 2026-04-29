import { useEffect, useRef, useState } from "react";
import {
  IconCheck,
  IconHistory,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { Button } from "./ui/button";
import { cn } from "./agent-elements/utils/cn";

import type { StudioChatSessionSummary } from "../../../shared/studio-api";

type ChatHistoryMenuProps = {
  sessions: StudioChatSessionSummary[];
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
  onRename: (sessionId: string, title: string) => Promise<void> | void;
  onDelete: (sessionId: string) => Promise<void> | void;
  onNewChat: () => void;
  className?: string;
};

export function ChatHistoryMenu({
  sessions,
  activeSessionId,
  onSelect,
  onRename,
  onDelete,
  onNewChat,
  className,
}: ChatHistoryMenuProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [editingTitle, setEditingTitle] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setEditingId(undefined);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setEditingId(undefined);
      }
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function startEdit(session: StudioChatSessionSummary) {
    setEditingId(session.id);
    setEditingTitle(session.title);
  }

  async function commitEdit() {
    if (!editingId) return;
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingId(undefined);
      return;
    }
    await onRename(editingId, trimmed);
    setEditingId(undefined);
  }

  async function handleDelete(session: StudioChatSessionSummary) {
    const ok = window.confirm(`Delete "${session.title}"? This cannot be undone.`);
    if (!ok) return;
    await onDelete(session.id);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
        title="Chat history"
        aria-label="Chat history"
      >
        <IconHistory size={15} strokeWidth={1.6} />
      </Button>

      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-80 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
            <span className="text-xs font-medium">Chats</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setOpen(false);
                onNewChat();
              }}
            >
              New chat
            </Button>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {sessions.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No previous chats yet.
              </li>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = session.id === editingId;
                return (
                  <li
                    key={session.id}
                    className={cn(
                      "group flex items-center gap-1 px-2",
                      isActive ? "bg-muted/40" : undefined,
                    )}
                  >
                    {isEditing ? (
                      <form
                        className="flex flex-1 items-center gap-1 py-1"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void commitEdit();
                        }}
                      >
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-ring"
                          aria-label="Rename chat"
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Save name"
                        >
                          <IconCheck size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingId(undefined)}
                          aria-label="Cancel"
                        >
                          <IconX size={14} />
                        </Button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="flex flex-1 flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60"
                          onClick={() => {
                            onSelect(session.id);
                            setOpen(false);
                          }}
                        >
                          <span
                            className={cn(
                              "max-w-full truncate",
                              isActive ? "font-medium" : "font-normal",
                            )}
                          >
                            {session.title}
                          </span>
                          <span className="text-[10px] font-light text-muted-foreground">
                            {formatRelative(session.updatedAt)}
                          </span>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition group-hover:opacity-100"
                          onClick={() => startEdit(session)}
                          aria-label="Rename"
                          title="Rename"
                        >
                          <IconPencil size={13} strokeWidth={1.6} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                          onClick={() => void handleDelete(session)}
                          aria-label="Delete"
                          title="Delete"
                        >
                          <IconTrash size={13} strokeWidth={1.6} />
                        </Button>
                      </>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
