import { useEffect, useMemo, useState } from "react";
import type { ChatStatus } from "ai";
import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconExternalLink,
  IconKey,
  IconLogout,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";

import { InputBar } from "./components/agent-elements/input-bar";
import { Conversation } from "./components/conversation";
import { Suggestions } from "./components/agent-elements/input/suggestions";
import { ModelPicker } from "./components/agent-elements/input/model-picker";
import { ModeSelector } from "./components/agent-elements/input/mode-selector";

import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Logo } from "./components/logo";

import type {
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioConversationSnapshot,
  StudioCustomProviderApi,
} from "../../shared/studio-api";

type View = "chat" | "settings";

const CUSTOM_PROVIDER_API_OPTIONS: {
  value: StudioCustomProviderApi;
  label: string;
}[] = [
  { value: "openai-completions", label: "OpenAI Chat Completions" },
  { value: "openai-responses", label: "OpenAI Responses API" },
  { value: "anthropic-messages", label: "Anthropic Messages" },
  { value: "google-generative-ai", label: "Google Generative AI" },
];

export default function App() {
  const [view, setView] = useState<View>("chat");
  const [authStatus, setAuthStatus] = useState<StudioAuthStatus | undefined>();
  const [conversation, setConversation] = useState<StudioConversationSnapshot>({
    status: "ready",
    messages: [],
  });
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [provider, setProvider] = useState("anthropic");
  const [oauthProviderId, setOauthProviderId] = useState("");
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

  useEffect(() => {
    const unsubscribe = window.api.onStudioEvent((event) => {
      if (event.type === "auth") {
        setAuthStatus(event.payload);
        setSelectedModelId(
          (current) => current || event.payload.selectedModelId || "",
        );
        setOauthProviderId(
          (current) => current || event.payload.oauthProviders[0]?.id || "",
        );
      }
      if (event.type === "conversation") {
        setConversation(event.payload);
        if (event.payload.error) setError(event.payload.error);
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
      setAuthStatus(nextAuth);
      setConversation(nextConversation);
      setSelectedModelId((current) => current || nextAuth.selectedModelId || "");
      setOauthProviderId(
        (current) => current || nextAuth.oauthProviders[0]?.id || "",
      );
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
      setOauthProviderId(providerId);
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
      setConversation(next);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  const providers = [
    { value: "anthropic", label: "Anthropic" },
    { value: "openai", label: "OpenAI" },
    { value: "google", label: "Google Gemini" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "vercel-ai-gateway", label: "Vercel AI Gateway" },
  ];

  const oauthProviderCards =
    authStatus?.oauthProviders.map((oauthProvider) => ({
      id: oauthProvider.id,
      name: oauthProvider.name,
      description:
        oauthProvider.id === "anthropic"
          ? "Claude Pro or Max"
          : oauthProvider.id.includes("codex")
            ? "ChatGPT Plus or Pro"
            : oauthProvider.id.includes("gemini")
              ? "Google Gemini CLI"
              : "Pi subscription login",
    })) ?? [];

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
        providers={providers}
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
        onRemoveCustomModel={handleRemoveCustomModel}
        customProviderApiOptions={CUSTOM_PROVIDER_API_OPTIONS}
        provider={provider}
        setProvider={setProvider}
        providers={providers}
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
      <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <div className="flex items-center gap-1">
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

      <section className="flex min-h-0 flex-1 flex-col">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <IconSparkles size={13} />
              Ready to design
            </div>
            <div className="space-y-2">
              <h1 className="text-balance text-3xl font-semibold tracking-tight">
                What should we design today?
              </h1>
              <p className="text-sm text-muted-foreground">
                Pick a model, describe the outcome, and Studio will plan
                before generating artifacts.
              </p>
            </div>
            <Suggestions
              items={[
                {
                  id: "deck-7slides",
                  label:
                    "Shape a 7-slide launch deck for an OSS Claude Design alternative.",
                },
                {
                  id: "ask-questions",
                  label: "Ask me what you need to plan a deck.",
                },
                {
                  id: "mvp-narrative",
                  label: "What should the MVP narrative be for Studio?",
                },
              ]}
              onSelect={(item) =>
                handleSend({ content: item.value ?? item.label })
              }
              className="justify-center"
            />
          </div>
        ) : (
          <Conversation
            messages={conversation.messages}
            status={conversation.status}
          />
        )}

        <InputBar
          status={conversation.status as ChatStatus}
          onSend={handleSend}
          onStop={handleStop}
          placeholder="Send a message..."
          disabled={displayedModels.length === 0}
          leftActions={
            <>
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
      </section>
    </main>
  );
}

type ProviderOption = { value: string; label: string };
type OauthCard = { id: string; name: string; description: string };

function AuthLanding({
  error,
  oauthProviderCards,
  authStatus,
  manualCode,
  setManualCode,
  onSubmitLoginCode,
  onStartLogin,
  provider,
  setProvider,
  providers,
  apiKey,
  setApiKey,
  onRuntimeKey,
  onRefresh,
}: {
  error?: string;
  oauthProviderCards: OauthCard[];
  authStatus: StudioAuthStatus | undefined;
  manualCode: string;
  setManualCode: (value: string) => void;
  onSubmitLoginCode: () => void;
  onStartLogin: (providerId: string) => void;
  provider: string;
  setProvider: (value: string) => void;
  providers: ProviderOption[];
  apiKey: string;
  setApiKey: (value: string) => void;
  onRuntimeKey: () => void;
  onRefresh: () => void;
}) {
  return (
    <main className="min-h-full overflow-y-auto bg-background text-foreground">
      <section className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo size="lg" />
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <IconRefresh size={15} />
            Refresh
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-foreground" />
              Local-first design agent
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-5xl font-semibold tracking-tight lg:text-6xl">
                Sign in to your model layer.
              </h1>
              <p className="max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
                Studio uses Pi for provider auth, model discovery, and the
                agent session. Login once, then pick the exact models you want
                visible in the workspace.
              </p>
            </div>
            {error ? (
              <Card className="border-destructive/40 bg-destructive/10">
                <CardContent className="py-3 text-sm text-destructive">
                  {error}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="border-border/80 bg-card/80 shadow-2xl shadow-black/5">
            <CardHeader>
              <CardTitle>Connect with Pi</CardTitle>
              <CardDescription>
                Choose a provider login. Studio opens the auth page and keeps
                tokens inside Pi auth storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {oauthProviderCards.length > 0 ? (
                  oauthProviderCards.map((oauthProvider) => (
                    <button
                      key={oauthProvider.id}
                      type="button"
                      onClick={() => onStartLogin(oauthProvider.id)}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-background/60 p-4 text-left transition-colors hover:bg-muted"
                    >
                      <span>
                        <span className="block font-medium">
                          {oauthProvider.name}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {oauthProvider.description}
                        </span>
                      </span>
                      <IconChevronRight
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        size={18}
                      />
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    No Pi OAuth providers were found. Refresh, or use a BYOK
                    key below.
                  </div>
                )}
              </div>

              {authStatus?.login && authStatus.login.status !== "idle" ? (
                <LoginStateCard
                  authStatus={authStatus}
                  manualCode={manualCode}
                  setManualCode={setManualCode}
                  onSubmitLoginCode={onSubmitLoginCode}
                />
              ) : null}

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Or use BYOK for this session
                </p>
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="Paste API key"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={onRuntimeKey}
                  disabled={!apiKey.trim()}
                >
                  <IconKey size={16} />
                  Continue with runtime key
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={window.api.openPiAuthDocs}
              >
                <IconExternalLink size={15} />
                Open Pi auth docs
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function SettingsPage({
  models,
  visibleModelIds,
  setVisibleModelIds,
  authStatus,
  oauthProviderCards,
  onStartLogin,
  onDisconnectProvider,
  onAddCustomProvider,
  onRemoveCustomModel,
  customProviderApiOptions,
  provider,
  setProvider,
  providers,
  apiKey,
  setApiKey,
  onRuntimeKey,
  onBack,
  onRefresh,
  error,
}: {
  models: { id: string; name: string; version?: string }[];
  visibleModelIds: string[];
  setVisibleModelIds: (
    updater: string[] | ((current: string[]) => string[]),
  ) => void;
  authStatus: StudioAuthStatus | undefined;
  oauthProviderCards: OauthCard[];
  onStartLogin: (providerId: string) => void;
  onDisconnectProvider: (providerId: string) => void;
  onAddCustomProvider: (input: StudioAddCustomProviderInput) => Promise<void>;
  onRemoveCustomModel: (providerId: string, modelId: string) => Promise<void>;
  customProviderApiOptions: { value: StudioCustomProviderApi; label: string }[];
  provider: string;
  setProvider: (value: string) => void;
  providers: ProviderOption[];
  apiKey: string;
  setApiKey: (value: string) => void;
  onRuntimeKey: () => void;
  onBack: () => void;
  onRefresh: () => void;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [cpId, setCpId] = useState("");
  const [cpBaseUrl, setCpBaseUrl] = useState("http://localhost:11434/v1");
  const [cpApi, setCpApi] =
    useState<StudioCustomProviderApi>("openai-completions");
  const [cpApiKey, setCpApiKey] = useState("ollama");
  const [cpModelId, setCpModelId] = useState("");
  const [cpModelName, setCpModelName] = useState("");
  const [customFormBusy, setCustomFormBusy] = useState(false);
  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [models, search]);

  const visibleCount =
    visibleModelIds.length === 0 ? models.length : visibleModelIds.length;

  function toggleModel(id: string, checked: boolean) {
    setVisibleModelIds((current) => {
      const base = current.length === 0 ? models.map((m) => m.id) : current;
      if (checked) return Array.from(new Set([...base, id]));
      return base.filter((existing) => existing !== id);
    });
  }

  async function submitCustomProvider() {
    setCustomFormBusy(true);
    try {
      await onAddCustomProvider({
        providerId: cpId,
        baseUrl: cpBaseUrl,
        api: cpApi,
        apiKey: cpApiKey,
        modelId: cpModelId,
        modelName: cpModelName.trim() || undefined,
      });
      setCpModelId("");
      setCpModelName("");
    } catch {
      /* error set in parent */
    } finally {
      setCustomFormBusy(false);
    }
  }

  async function removeCustomModelRow(providerId: string, modelId: string) {
    try {
      await onRemoveCustomModel(providerId, modelId);
    } catch {
      /* error set in parent */
    }
  }

  return (
    <main className="min-h-full overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
              <IconArrowLeft size={18} />
            </Button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Studio
              </p>
              <h1 className="text-base font-semibold">Agent settings</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <IconRefresh size={15} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        {error ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="py-3 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {authStatus?.modelsJsonSyntaxError ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="py-3 text-sm text-destructive">
              Could not parse models.json: {authStatus.modelsJsonSyntaxError}
            </CardContent>
          </Card>
        ) : null}

        {authStatus?.modelsRegistryError ? (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-3 text-sm text-amber-950 dark:text-amber-100">
              Pi rejected models.json: {authStatus.modelsRegistryError}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Visible models</CardTitle>
                <CardDescription>
                  Choose which authenticated models appear in the picker.
                </CardDescription>
              </div>
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                {visibleCount} / {models.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <IconSearch
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search models"
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleModelIds(
                    visibleModelIds.length === 0 ? [] : models.map((m) => m.id),
                  )
                }
              >
                Show all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setVisibleModelIds(
                    models.length > 0 ? [models[0].id] : [],
                  )
                }
              >
                Reset
              </Button>
            </div>

            <ul className="divide-y divide-border rounded-xl border border-border">
              {filteredModels.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No matching models.
                </li>
              ) : (
                filteredModels.map((model) => {
                  const checked =
                    visibleModelIds.length === 0 ||
                    visibleModelIds.includes(model.id);
                  return (
                    <li key={model.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {model.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {model.id}
                            {model.version ? ` · ${model.version}` : ""}
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="size-4 accent-foreground"
                          checked={checked}
                          onChange={(event) =>
                            toggleModel(model.id, event.target.checked)
                          }
                        />
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom models</CardTitle>
            <CardDescription>
              Add local or proxy providers (Ollama, LM Studio, vLLM, etc.) to
              your Pi{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                models.json
              </code>
              . Reuses the same format as{" "}
              <button
                type="button"
                className="text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
                onClick={() => void window.api.openPiModelsDocs()}
              >
                Pi custom models docs
              </button>
              . Using the same provider id again adds another model to that
              block.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
              <p className="text-sm font-medium">Add provider &amp; model</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cp-id">Provider id</Label>
                  <Input
                    id="cp-id"
                    value={cpId}
                    onChange={(e) => setCpId(e.target.value)}
                    placeholder="ollama"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cp-base">Base URL</Label>
                  <Input
                    id="cp-base"
                    value={cpBaseUrl}
                    onChange={(e) => setCpBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>API type</Label>
                  <Select
                    value={cpApi}
                    onValueChange={(v) =>
                      setCpApi(v as StudioCustomProviderApi)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customProviderApiOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-key">API key</Label>
                  <Input
                    id="cp-key"
                    value={cpApiKey}
                    onChange={(e) => setCpApiKey(e.target.value)}
                    placeholder="ollama or sk-..."
                    type="password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-mid">Model id</Label>
                  <Input
                    id="cp-mid"
                    value={cpModelId}
                    onChange={(e) => setCpModelId(e.target.value)}
                    placeholder="llama3.1:8b"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-mname">Display name (optional)</Label>
                  <Input
                    id="cp-mname"
                    value={cpModelName}
                    onChange={(e) => setCpModelName(e.target.value)}
                    placeholder="Llama 3.1 8B local"
                  />
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={
                  customFormBusy ||
                  !cpId.trim() ||
                  !cpBaseUrl.trim() ||
                  !cpApiKey.trim() ||
                  !cpModelId.trim()
                }
                onClick={() => void submitCustomProvider()}
              >
                Add to models.json
              </Button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Entries in models.json</p>
              {authStatus?.customModels?.length ? (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {authStatus.customModels.map((row) => (
                    <li
                      key={`${row.providerId}/${row.modelId}`}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {row.fullId}
                        </p>
                        {row.name ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {row.name}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          void removeCustomModelRow(
                            row.providerId,
                            row.modelId,
                          )
                        }
                        aria-label={`Remove ${row.fullId}`}
                      >
                        <IconTrash size={16} />
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No custom model entries in models.json yet.
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => void window.api.openPiModelsDocs()}
            >
              <IconExternalLink size={14} />
              Open Pi custom models docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected providers</CardTitle>
            <CardDescription>
              Pi stores subscription OAuth and API keys in{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                ~/.pi/agent/auth.json
              </code>
              . Disconnect clears that provider the same way Pi&apos;s{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                /logout
              </code>{" "}
              command does (see Pi provider docs below). If models remain,
              credentials may still come from environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {oauthProviderCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No providers detected.
              </p>
            ) : (
              oauthProviderCards.map((p) => {
                const authed = authStatus?.availableModels.some(
                  (model) =>
                    model.provider === p.id ||
                    model.provider.includes(p.id) ||
                    p.id.includes(model.provider),
                );
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      {authed ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                          <IconCheck size={12} />
                          Connected
                        </span>
                      ) : null}
                      {authed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDisconnectProvider(p.id)}
                        >
                          Disconnect
                        </Button>
                      ) : null}
                      <Button
                        variant={authed ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => onStartLogin(p.id)}
                      >
                        {authed ? "Reconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={window.api.openPiAuthDocs}
            >
              <IconExternalLink size={14} />
              Open Pi auth docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bring your own key</CardTitle>
            <CardDescription>
              Use a runtime API key for this session. Not persisted to disk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Paste API key"
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={onRuntimeKey}
              disabled={!apiKey.trim()}
            >
              <IconKey size={16} />
              Save runtime key
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>
              Use Disconnect above per provider. To revoke access everywhere,
              remove keys from your shell profile or Pi&apos;s auth file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={window.api.openPiAuthDocs}>
              <IconLogout size={15} />
              Pi auth &amp; providers reference
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function LoginStateCard({
  authStatus,
  manualCode,
  setManualCode,
  onSubmitLoginCode,
}: {
  authStatus: StudioAuthStatus;
  manualCode: string;
  setManualCode: (value: string) => void;
  onSubmitLoginCode: () => void;
}) {
  if (!authStatus.login || authStatus.login.status === "idle") return null;

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-sm">
          {authStatus.login.providerName ?? authStatus.login.providerId} login:{" "}
          {authStatus.login.status}
        </CardTitle>
        {authStatus.login.instructions ? (
          <CardDescription>{authStatus.login.instructions}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {authStatus.login.authUrl ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => window.open(authStatus.login?.authUrl, "_blank")}
          >
            Reopen login page
          </Button>
        ) : null}
        {authStatus.login.progress?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {authStatus.login.progress.slice(-4).map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
        {authStatus.login.needsManualCode ? (
          <div className="space-y-2">
            <Label htmlFor="manual-code">
              {authStatus.login.promptMessage ?? "Manual login code"}
            </Label>
            <Input
              id="manual-code"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Paste redirect URL or code"
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={onSubmitLoginCode}
              disabled={!manualCode.trim()}
            >
              Submit login code
            </Button>
          </div>
        ) : null}
        {authStatus.login.status === "completed" ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconCheck size={14} />
            Login completed. Loading models...
          </p>
        ) : null}
        {authStatus.login.error ? (
          <p className="text-xs text-destructive">{authStatus.login.error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
