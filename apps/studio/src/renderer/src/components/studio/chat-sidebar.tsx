import type { ChatStatus } from "ai";
import {
  IconLayoutSidebarLeftCollapse,
  IconMoon,
  IconPlus,
  IconSettings,
  IconSun,
} from "@tabler/icons-react";

import { InputBar } from "@/components/agent-elements/input-bar";
import { Conversation } from "@/components/conversation";
import { ModelPicker } from "@/components/agent-elements/input/model-picker";
import { Suggestions } from "@/components/agent-elements/input/suggestions";
import { ChatHistoryMenu } from "@/components/chat-history-menu";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { StudioAuthStatus } from "../../../../shared/studio-api";
import type { StudioAppState } from "@/hooks/use-studio-app-state";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

type ChatSidebarProps = Pick<
  StudioAppState,
  | "conversation"
  | "chatSessions"
  | "authStatus"
  | "error"
  | "displayedModels"
  | "selectedModelId"
> & {
  /** macOS: push header content past native traffic lights (hiddenInset). */
  darwinTrafficLightInset?: boolean;
  onCollapse: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onModelChange: (modelId: string) => void;
  onSend: (message: { content: string }) => void;
  onStop: () => void;
  onOpenChatSession: (sessionId: string) => void;
  onRenameChatSession: (sessionId: string, title: string) => void;
  onDeleteChatSession: (sessionId: string) => void;
};

export function ChatSidebar({
  conversation,
  chatSessions,
  authStatus,
  error,
  displayedModels,
  selectedModelId,
  darwinTrafficLightInset = false,
  onCollapse,
  onNewChat,
  onOpenSettings,
  onModelChange,
  onSend,
  onStop,
  onOpenChatSession,
  onRenameChatSession,
  onDeleteChatSession,
}: ChatSidebarProps) {
  const { theme, toggle } = useTheme();
  return (
    <aside className="flex min-h-0 w-[30%] min-w-[320px] max-w-[460px] flex-col rounded-xl border border-border bg-background shadow-sm">
      <header
        className={cn(
          "flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70",
          darwinTrafficLightInset ? "ps-[78px] pe-4" : "px-4",
        )}
      >
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <IconSun size={18} aria-hidden />
            ) : (
              <IconMoon size={18} aria-hidden />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            disabled={conversation.messages.length === 0}
            aria-label="New chat"
            title="New chat"
          >
            <IconPlus size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label="Settings"
            title="Settings"
          >
            <IconSettings size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            aria-label="Hide chat"
            title="Hide chat"
          >
            <IconLayoutSidebarLeftCollapse size={18} />
          </Button>
        </div>
      </header>

      <ChatSidebarAlerts error={error} setupHint={authStatus?.setupHint} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <h1 className="text-balance text-center text-2xl font-light tracking-tight text-foreground/80">
              Design something
            </h1>
            <Suggestions
              items={[
                {
                  id: "deck",
                  label: "Launch deck",
                  value:
                    "Help me plan a 7-slide launch deck for an OSS Claude Design alternative.",
                },
                {
                  id: "ask",
                  label: "Plan with me",
                  value: "Ask me what you need to plan a deck.",
                },
                {
                  id: "mvp",
                  label: "MVP narrative",
                  value: "What should the MVP narrative be for Studio?",
                },
              ]}
              onSelect={(item) =>
                onSend({ content: item.value ?? item.label })
              }
              className="mt-4 justify-center"
              itemClassName="h-6 px-2 text-xs"
            />
          </div>
        ) : (
          <Conversation
            messages={conversation.messages}
            status={conversation.status}
          />
        )}

        <InputBar
          className="studio-input"
          status={conversation.status as ChatStatus}
          onSend={onSend}
          onStop={onStop}
          placeholder="Message"
          disabled={displayedModels.length === 0}
          leftActions={
            <>
              <ModelPicker
                models={displayedModels}
                value={selectedModelId}
                onChange={onModelChange}
              />
              <ChatHistoryMenu
                sessions={chatSessions}
                activeSessionId={conversation.id}
                onSelect={onOpenChatSession}
                onRename={onRenameChatSession}
                onDelete={onDeleteChatSession}
                onNewChat={onNewChat}
              />
            </>
          }
        />
      </div>
    </aside>
  );
}

function ChatSidebarAlerts({
  error,
  setupHint,
}: {
  error: string | undefined;
  setupHint: StudioAuthStatus["setupHint"];
}) {
  if (!error && !setupHint) return null;
  return (
    <div className="px-4 pt-3">
      {error ? (
        <Card className="mb-2 border-destructive/40 bg-destructive/10">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}
      {setupHint ? (
        <Card className="mb-2 border-accent/40 bg-accent/10">
          <CardContent className="py-3 text-sm">{setupHint}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
