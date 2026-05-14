import { memo, useMemo } from "react";
import { CheckIcon, IconArrowRight } from "../icons";
import { TextShimmer } from "../text-shimmer";
import { getToolStatus, areToolPropsEqual } from "../utils/format-tool";
import { cn } from "../utils/cn";

export type TodoItem = {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
};

export type TodoToolProps = {
  part: any;
  chatStatus?: string;
};

export type TodoChange = {
  todo: TodoItem;
  oldStatus?: TodoItem["status"];
  newStatus: TodoItem["status"];
  index: number;
};

type ChangeType = "creation" | "single" | "multiple";

export type DetectedChanges = {
  type: ChangeType;
  items: TodoChange[];
};

function detectChanges(
  oldTodos: TodoItem[],
  newTodos: TodoItem[],
): DetectedChanges {
  if (!oldTodos || oldTodos.length === 0) {
    return {
      type: "creation",
      items: newTodos.map((todo, index) => ({
        todo,
        newStatus: todo.status,
        index,
      })),
    };
  }

  const changes: TodoChange[] = [];
  newTodos.forEach((newTodo, index) => {
    const oldTodo = oldTodos[index];
    if (!oldTodo || oldTodo.status !== newTodo.status) {
      changes.push({
        todo: newTodo,
        oldStatus: oldTodo?.status,
        newStatus: newTodo.status,
        index,
      });
    }
  });

  if (changes.length === 1) return { type: "single", items: changes };
  return { type: "multiple", items: changes };
}

const TodoStatusIcon = ({
  status,
  isPending,
}: {
  status: TodoItem["status"];
  isPending?: boolean;
}) => {
  if (isPending && status === "in_progress") {
    return (
      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border border-an-foreground-muted/60">
        <IconArrowRight className="w-2 h-2 text-an-foreground-muted/70" />
      </div>
    );
  }

  switch (status) {
    case "completed":
      return (
        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border border-an-foreground-muted/40">
          <CheckIcon className="w-2 h-2 text-an-foreground-muted/70" />
        </div>
      );
    case "in_progress":
      return (
        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border border-an-foreground-muted/60">
          <IconArrowRight className="w-2 h-2 text-an-foreground-muted/70" />
        </div>
      );
    default:
      return (
        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border border-an-foreground-muted/60" />
      );
  }
};

const TodoListItem = memo(function TodoListItem({
  todo,
  isPending,
}: {
  todo: TodoItem;
  isPending: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-2")}>
      <div className="mt-[2px]">
        <TodoStatusIcon status={todo.status} isPending={isPending} />
      </div>
      <span
        className={cn(
          "text-sm",
          todo.status === "completed" && "line-through",
          isPending || todo.status === "completed" || todo.status === "pending"
            ? "text-an-foreground/60"
            : "text-an-foreground/80",
        )}
      >
        {todo.content}
      </span>
    </div>
  );
});

export const TodoTool = memo(function TodoTool({
  part,
  chatStatus,
}: TodoToolProps) {
  const { isPending } = getToolStatus(part, chatStatus);

  const isStreaming = part.state === "input-streaming";
  const oldTodos: TodoItem[] = part.output?.oldTodos || [];
  const newTodos: TodoItem[] = part.input?.todos || part.output?.newTodos || [];

  const isCreation = oldTodos.length === 0;
  const changes = useMemo(
    () => detectChanges(oldTodos, newTodos),
    [oldTodos, newTodos],
  );

  // Streaming placeholder — always shimmer while in this transient state.
  if (isStreaming || newTodos.length === 0) {
    return (
      <div className="space-y-2 text-sm leading-relaxed text-an-foreground/80">
        <div className="text-an-foreground/60">
          <TextShimmer
            as="span"
            duration={1.2}
            className="inline-flex items-center text-sm leading-none h-4 m-0"
          >
            {isCreation ? "Creating to-do list..." : "Updating to-dos..."}
          </TextShimmer>
        </div>
      </div>
    );
  }

  // Single update - show full list for clarity
  if (changes.type === "single") {
    return (
      <div className="space-y-2 text-sm leading-relaxed text-an-foreground/80">
        {newTodos.map((todo, idx) => (
          <TodoListItem key={idx} todo={todo} isPending={isPending} />
        ))}
      </div>
    );
  }

  // Multiple updates - show full list for clarity
  if (changes.type === "multiple") {
    return (
      <div className="space-y-2 text-sm leading-relaxed text-an-foreground/80">
        {newTodos.map((todo, idx) => (
          <TodoListItem key={idx} todo={todo} isPending={isPending} />
        ))}
      </div>
    );
  }

  const displayTodos = newTodos;
  return (
    <div className="space-y-2 text-sm leading-relaxed text-an-foreground/80">
      {displayTodos.map((todo, idx) => (
        <TodoListItem key={idx} todo={todo} isPending={isPending} />
      ))}
    </div>
  );
}, areToolPropsEqual);
