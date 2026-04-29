import { useEffect, useMemo, useState } from "react";
import type { ChatStatus } from "ai";
import {
  IconPlus,
  IconLayoutSidebarRightExpand,
  IconSettings,
} from "@tabler/icons-react";

import { InputBar } from "./components/agent-elements/input-bar";
import { Conversation } from "./components/conversation";
import { Suggestions } from "./components/agent-elements/input/suggestions";
import { ModelPicker } from "./components/agent-elements/input/model-picker";
import { ModeSelector } from "./components/agent-elements/input/mode-selector";
import { AuthLanding } from "./components/auth-landing";
import { ChatHistoryMenu } from "./components/chat-history-menu";
import { DeckWorkspace } from "./components/deck-workspace";
import { SettingsPage } from "./components/settings-page";

import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
} from "./components/ui/card";
import { Logo } from "./components/logo";

import { formatProviderDisplayName } from "./lib/format-provider-label";
import { toErrorMessage } from "./lib/to-error-message";
import {
  BYOK_PROVIDER_OPTIONS,
  CUSTOM_PROVIDER_API_OPTIONS,
} from "./studio/constants";
import { buildOauthProviderCards } from "./studio/oauth-cards";

import type {
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioChatSessionSummary,
  StudioConversationSnapshot,
  StudioDeckExportFormat,
  StudioDeckProject,
} from "../../shared/studio-api";

type View = "chat" | "settings";

export default function App() {
  const [view, setView] = useState<View>("chat");
  const [authStatus, setAuthStatus] = useState<StudioAuthStatus | undefined>();
  const [conversation, setConversation] = useState<StudioConversationSnapshot>({
    status: "ready",
    messages: [],
  });
  const [chatSessions, setChatSessions] = useState<StudioChatSessionSummary[]>([]);
  const [decks, setDecks] = useState<StudioDeckProject[]>([]);
  const [userSelectedDeckId, setUserSelectedDeckId] = useState<string | undefined>();
  const [isArtifactOpen, setIsArtifactOpen] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [visibleModelIds, setVisibleModelIds] = useState<string[]>(() => {
    const raw = localStorage.getItem("studio.visibleModelIds");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((id) => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  });

  const oauthProviderCards = useMemo(
    () => buildOauthProviderCards(authStatus?.oauthProviders),
    [authStatus?.oauthProviders],
  );

  useEffect(() => {
    const unsubscribe = window.api.onStudioEvent((event) => {
      if (event.type === "auth") {
        setAuthStatus(event.payload);
        setSelectedModelId(
          (current) => current || event.payload.selectedModelId || "",
        );
      }
      if (event.type === "conversation") {
        setConversation(event.payload);
        if (event.payload.error) setError(event.payload.error);
      }
      if (event.type === "decks") {
        setDecks(event.payload);
        setUserSelectedDeckId((current) =>
          current && event.payload.some((deck) => deck.id === current)
            ? current
            : undefined,
        );
      }
      if (event.type === "sessions") {
        setChatSessions(event.payload);
      }
    });

    void refresh();
    return unsubscribe;
  }, []);

  const models = useMemo(
    () =>
      authStatus?.availableModels.map((model) => ({
        id: model.id,
        name: model.label,
        version: model.contextWindow
          ? `${Math.round(model.contextWindow / 1000)}k`
          : undefined,
        provider: model.provider,
        providerLabel: formatProviderDisplayName(
          model.provider,
          authStatus.oauthProviders,
        ),
      })) ?? [],
    [authStatus],
  );

  const displayedModels = useMemo(() => {
    if (models.length === 0) return [];
    if (visibleModelIds.length === 0) return models;
    const allowed = new Set(visibleModelIds);
    const filtered = models.filter((model) => allowed.has(model.id));
    return filtered.length > 0 ? filtered : models;
  }, [models, visibleModelIds]);

  const isAuthed = Boolean(authStatus?.hasAvailableModels);

  const selectedDeckId = useMemo(() => {
    if (
      userSelectedDeckId &&
      decks.some((deck) => deck.id === userSelectedDeckId)
    ) {
      return userSelectedDeckId;
    }
    return decks.find((deck) => deck.id === conversation.currentArtifactId)?.id;
  }, [decks, conversation.currentArtifactId, userSelectedDeckId]);

  useEffect(() => {
    localStorage.setItem(
      "studio.visibleModelIds",
      JSON.stringify(visibleModelIds),
    );
  }, [visibleModelIds]);

  useEffect(() => {
    if (!selectedModelId && displayedModels[0]) {
      setSelectedModelId(displayedModels[0].id);
      void window.api.selectModel({ modelId: displayedModels[0].id });
    }
    if (selectedModelId && displayedModels.length > 0) {
      const isVisible = displayedModels.some(
        (model) => model.id === selectedModelId,
      );
      if (!isVisible) {
        setSelectedModelId(displayedModels[0].id);
        void window.api.selectModel({ modelId: displayedModels[0].id });
      }
    }
  }, [displayedModels, selectedModelId]);

  async function refresh() {
    try {
      setError(undefined);
      const [nextAuth, nextConversation] = await Promise.all([
        window.api.getAuthStatus(),
        window.api.getConversation(),
      ]);
      const [nextDecks, nextSessions] = await Promise.all([
        window.api.listDecks(),
        window.api.listChatSessions(),
      ]);
      setAuthStatus(nextAuth);
      setConversation(nextConversation);
      setDecks(nextDecks);
      setChatSessions(nextSessions);
      setUserSelectedDeckId(undefined);
      setSelectedModelId((current) => current || nextAuth.selectedModelId || "");
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleRuntimeKey() {
    try {
      setError(undefined);
      const nextAuth = await window.api.setRuntimeApiKey({ provider, apiKey });
      setAuthStatus(nextAuth);
      setApiKey("");
      setSelectedModelId(
        nextAuth.selectedModelId ?? nextAuth.availableModels[0]?.id ?? "",
      );
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleSubmitLoginCode() {
    try {
      setError(undefined);
      const nextAuth = await window.api.submitLoginCode({ code: manualCode });
      setAuthStatus(nextAuth);
      setManualCode("");
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleStartLogin(providerId: string) {
    try {
      setError(undefined);
      const nextAuth = await window.api.startLogin({ providerId });
      setAuthStatus(nextAuth);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleDisconnectProvider(providerId: string) {
    const label =
      oauthProviderCards.find((p) => p.id === providerId)?.name ?? providerId;
    const ok = window.confirm(
      `Disconnect ${label}? This removes that provider from Pi auth storage (same as the /logout command in Pi) and clears any runtime API key Studio set for it. Models that only relied on those credentials will disappear.`,
    );
    if (!ok) return;
    try {
      setError(undefined);
      const nextAuth = await window.api.disconnectProvider({ providerId });
      setAuthStatus(nextAuth);
      setSelectedModelId(
        nextAuth.selectedModelId ?? nextAuth.availableModels[0]?.id ?? "",
      );
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleAddCustomProvider(input: StudioAddCustomProviderInput) {
    try {
      setError(undefined);
      const nextAuth = await window.api.addCustomProvider(input);
      setAuthStatus(nextAuth);
      setSelectedModelId(
        nextAuth.selectedModelId ?? nextAuth.availableModels[0]?.id ?? "",
      );
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }

  async function handleAddCustomModel(input: {
    providerId: string;
    modelId: string;
    modelName?: string;
  }) {
    try {
      setError(undefined);
      const nextAuth = await window.api.addCustomModel(input);
      setAuthStatus(nextAuth);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }

  async function handleRemoveCustomModel(providerId: string, modelId: string) {
    const ok = window.confirm(
      `Remove "${providerId}/${modelId}" from models.json? This cannot be undone.`,
    );
    if (!ok) return;
    try {
      setError(undefined);
      const nextAuth = await window.api.removeCustomModel({
        providerId,
        modelId,
      });
      setAuthStatus(nextAuth);
      setSelectedModelId(
        nextAuth.selectedModelId ?? nextAuth.availableModels[0]?.id ?? "",
      );
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }

  async function handleModelChange(modelId: string) {
    try {
      setError(undefined);
      setSelectedModelId(modelId);
      const nextAuth = await window.api.selectModel({ modelId });
      setAuthStatus(nextAuth);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleSend(message: { content: string }) {
    if (!message.content.trim()) return;
    try {
      setError(undefined);
      const nextConversation = await window.api.sendPrompt({
        content: message.content,
        modelId: selectedModelId || undefined,
      });
      setConversation(nextConversation);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleStop() {
    try {
      setConversation(await window.api.stop());
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleNewChat() {
    try {
      setError(undefined);
      const next = await window.api.newConversation();
      const nextDecks = await window.api.listDecks();
      setConversation(next);
      setDecks(nextDecks);
      setUserSelectedDeckId(undefined);
      setIsArtifactOpen(true);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleRenameChatSession(sessionId: string, title: string) {
    try {
      setError(undefined);
      const next = await window.api.renameChatSession({ sessionId, title });
      setChatSessions(next);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleDeleteChatSession(sessionId: string) {
    try {
      setError(undefined);
      const next = await window.api.deleteChatSession({ sessionId });
      setConversation(next);
      const [nextSessions, nextDecks] = await Promise.all([
        window.api.listChatSessions(),
        window.api.listDecks(),
      ]);
      setChatSessions(nextSessions);
      setDecks(nextDecks);
      setUserSelectedDeckId(undefined);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleOpenChatSession(sessionId: string) {
    if (sessionId === conversation.id) return;
    try {
      setError(undefined);
      const nextConversation = await window.api.openChatSession(sessionId);
      const nextDecks = await window.api.listDecks();
      setConversation(nextConversation);
      setDecks(nextDecks);
      setUserSelectedDeckId(undefined);
      setIsArtifactOpen(true);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleOpenDeck(deckId: string) {
    try {
      setError(undefined);
      await window.api.openDeck(deckId);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }

  async function handleCreateMockArtifact() {
    try {
      setError(undefined);
      const deck = await window.api.createMockArtifact();
      const nextDecks = await window.api.listDecks();
      setDecks(nextDecks.length > 0 ? nextDecks : [deck]);
      setUserSelectedDeckId(deck.id);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }

  async function handleExportDeck(
    deckId: string,
    format: StudioDeckExportFormat,
  ) {
    try {
      setError(undefined);
      return await window.api.exportDeck({ deckId, format });
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }

  if (!isAuthed) {
    return (
      <AuthLanding
        error={error}
        oauthProviderCards={oauthProviderCards}
        authStatus={authStatus}
        manualCode={manualCode}
        setManualCode={setManualCode}
        onSubmitLoginCode={handleSubmitLoginCode}
        onStartLogin={handleStartLogin}
        provider={provider}
        setProvider={setProvider}
        providers={BYOK_PROVIDER_OPTIONS}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onRuntimeKey={handleRuntimeKey}
        onRefresh={refresh}
      />
    );
  }

  if (view === "settings") {
    return (
      <SettingsPage
        models={models}
        visibleModelIds={visibleModelIds}
        setVisibleModelIds={setVisibleModelIds}
        authStatus={authStatus}
        oauthProviderCards={oauthProviderCards}
        onStartLogin={handleStartLogin}
        onDisconnectProvider={handleDisconnectProvider}
        onAddCustomProvider={handleAddCustomProvider}
        onAddCustomModel={handleAddCustomModel}
        onRemoveCustomModel={handleRemoveCustomModel}
        customProviderApiOptions={CUSTOM_PROVIDER_API_OPTIONS}
        provider={provider}
        setProvider={setProvider}
        providers={BYOK_PROVIDER_OPTIONS}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onRuntimeKey={handleRuntimeKey}
        onBack={() => setView("chat")}
        onRefresh={refresh}
        error={error}
      />
    );
  }

  return (
    <main className="flex h-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 bg-background/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <div className="flex items-center gap-1">
          {!isArtifactOpen ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsArtifactOpen(true)}
              aria-label="Open artifact"
              title="Open artifact"
            >
              <IconLayoutSidebarRightExpand size={18} />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            disabled={conversation.messages.length === 0}
            aria-label="New chat"
            title="New chat"
          >
            <IconPlus size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("settings")}
            aria-label="Settings"
            title="Settings"
          >
            <IconSettings size={18} />
          </Button>
        </div>
      </header>

      {(error || authStatus?.setupHint) && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-3">
          {error ? (
            <Card className="mb-2 border-destructive/40 bg-destructive/10">
              <CardContent className="py-3 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : null}
          {authStatus?.setupHint ? (
            <Card className="mb-2 border-accent/40 bg-accent/10">
              <CardContent className="py-3 text-sm">
                {authStatus.setupHint}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <section className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {conversation.messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6">
              <h1 className="text-balance text-center text-3xl font-light tracking-tight text-foreground/90">
                What should we design today?
              </h1>
              <Suggestions
                items={[
                  {
                    id: "deck",
                    label: "Plan a launch deck",
                    value:
                      "Help me plan a 7-slide launch deck for an OSS Claude Design alternative.",
                  },
                  {
                    id: "ask",
                    label: "Ask me first",
                    value: "Ask me what you need to plan a deck.",
                  },
                  {
                    id: "mvp",
                    label: "MVP narrative",
                    value: "What should the MVP narrative be for Studio?",
                  },
                ]}
                onSelect={(item) =>
                  handleSend({ content: item.value ?? item.label })
                }
                className="mt-6 justify-center"
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
            onSend={handleSend}
            onStop={handleStop}
            placeholder="Send a message..."
            disabled={displayedModels.length === 0}
            leftActions={
              <>
                <ChatHistoryMenu
                  sessions={chatSessions}
                  activeSessionId={conversation.id}
                  onSelect={handleOpenChatSession}
                  onRename={handleRenameChatSession}
                  onDelete={handleDeleteChatSession}
                  onNewChat={handleNewChat}
                />
                <ModelPicker
                  models={displayedModels}
                  value={selectedModelId}
                  onChange={handleModelChange}
                />
                <ModeSelector
                  modes={[
                    { id: "chat", label: "Chat" },
                    { id: "deck-plan", label: "Deck plan" },
                  ]}
                  value="chat"
                />
              </>
            }
          />
        </div>
        {isArtifactOpen ? (
          <DeckWorkspace
            decks={decks}
            selectedDeckId={selectedDeckId}
            status={conversation.status}
            onClose={() => setIsArtifactOpen(false)}
            onSelectDeck={setUserSelectedDeckId}
            onOpenDeck={handleOpenDeck}
            onExportDeck={handleExportDeck}
            onCreateMockArtifact={handleCreateMockArtifact}
          />
        ) : null}
      </section>
    </main>
  );
}
