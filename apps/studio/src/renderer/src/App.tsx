import { useEffect, useMemo, useState } from "react";
import type { ChatStatus, UIMessage } from "ai";
import { IconKey, IconRefresh, IconSparkles } from "@tabler/icons-react";

import { AgentChat } from "./components/agent-elements/agent-chat";
import { ModelPicker } from "./components/agent-elements/input/model-picker";
import { ModeSelector } from "./components/agent-elements/input/mode-selector";
import type {
  StudioAuthStatus,
  StudioConversationSnapshot,
  StudioMessage,
} from "../../shared/studio-api";

export default function App() {
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

  useEffect(() => {
    const unsubscribe = window.api.onStudioEvent((event) => {
      if (event.type === "auth") {
        setAuthStatus(event.payload);
        setSelectedModelId((current) => current || event.payload.selectedModelId || "");
        setOauthProviderId((current) => current || event.payload.oauthProviders[0]?.id || "");
      }
      if (event.type === "conversation") {
        setConversation(event.payload);
        if (event.payload.error) setError(event.payload.error);
      }
    });

    void refresh();
    return unsubscribe;
  }, []);

  const uiMessages = useMemo(
    () => conversation.messages.map(toUiMessage),
    [conversation.messages],
  );

  const models = useMemo(
    () =>
      authStatus?.availableModels.map((model) => ({
        id: model.id,
        name: model.label,
        version: model.contextWindow ? `${Math.round(model.contextWindow / 1000)}k` : undefined,
      })) ?? [],
    [authStatus],
  );

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
      setOauthProviderId((current) => current || nextAuth.oauthProviders[0]?.id || "");
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
      setSelectedModelId(nextAuth.selectedModelId ?? nextAuth.availableModels[0]?.id ?? "");
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }

  async function handleStartLogin() {
    try {
      setError(undefined);
      const nextAuth = await window.api.startLogin({ providerId: oauthProviderId });
      setAuthStatus(nextAuth);
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

  async function handleSend({ content }: { content: string }) {
    try {
      setError(undefined);
      const nextConversation = await window.api.sendPrompt({
        content,
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

  return (
    <main className="studio-app">
      <aside className="studio-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <IconSparkles size={18} />
          </div>
          <div>
            <h1>Studio</h1>
            <p>Open design agent, powered by Pi</p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <h2>Pi Auth</h2>
            <button className="icon-button" type="button" onClick={refresh} aria-label="Refresh">
              <IconRefresh size={16} />
            </button>
          </div>
          <p className="muted">
            Studio reads Pi auth from <code>{authStatus?.authFile ?? "~/.pi/agent/auth.json"}</code>.
            You can login through Studio or use a runtime BYOK key.
          </p>
          <label className="field">
            <span>Pi login provider</span>
            <select
              value={oauthProviderId}
              onChange={(event) => setOauthProviderId(event.target.value)}
              disabled={!authStatus?.oauthProviders.length}
            >
              {authStatus?.oauthProviders.length ? (
                authStatus.oauthProviders.map((oauthProvider) => (
                  <option key={oauthProvider.id} value={oauthProvider.id}>
                    {oauthProvider.name}
                  </option>
                ))
              ) : (
                <option value="">No OAuth providers found</option>
              )}
            </select>
          </label>
          <button
            className="primary-button"
            type="button"
            onClick={handleStartLogin}
            disabled={!oauthProviderId || authStatus?.login?.status === "waiting"}
          >
            <IconKey size={16} />
            Login with Pi
          </button>
          {authStatus?.login && authStatus.login.status !== "idle" ? (
            <div className="login-card">
              <div className="login-card-title">
                {authStatus.login.providerName ?? authStatus.login.providerId} login:{" "}
                {authStatus.login.status}
              </div>
              {authStatus.login.instructions ? (
                <p className="muted">{authStatus.login.instructions}</p>
              ) : null}
              {authStatus.login.authUrl ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => window.open(authStatus.login?.authUrl, "_blank")}
                >
                  Reopen login page
                </button>
              ) : null}
              {authStatus.login.progress?.length ? (
                <ul className="login-progress">
                  {authStatus.login.progress.slice(-4).map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {authStatus.login.needsManualCode ? (
                <div className="manual-code">
                  <label className="field">
                    <span>{authStatus.login.promptMessage ?? "Manual login code"}</span>
                    <input
                      value={manualCode}
                      onChange={(event) => setManualCode(event.target.value)}
                      placeholder="Paste redirect URL or code"
                    />
                  </label>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleSubmitLoginCode}
                    disabled={!manualCode.trim()}
                  >
                    Submit login code
                  </button>
                </div>
              ) : null}
              {authStatus.login.error ? (
                <p className="login-error">{authStatus.login.error}</p>
              ) : null}
            </div>
          ) : null}
          <div className="divider" />
          <label className="field">
            <span>Provider</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="google">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
              <option value="vercel-ai-gateway">Vercel AI Gateway</option>
            </select>
          </label>
          <label className="field">
            <span>Runtime API key</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              type="password"
              placeholder="Paste a BYOK key"
            />
          </label>
          <button className="primary-button" type="button" onClick={handleRuntimeKey}>
            <IconKey size={16} />
            Use key for this session
          </button>
          <button className="secondary-button" type="button" onClick={window.api.openPiAuthDocs}>
            Open Pi auth docs
          </button>
        </section>

        <section className="panel">
          <h2>MVP Status</h2>
          <ul className="status-list">
            <li className="done">Standalone Studio shell</li>
            <li className={authStatus?.hasAvailableModels ? "done" : "waiting"}>
              Pi auth and available models
            </li>
            <li className={conversation.messages.length > 0 ? "done" : "waiting"}>
              Back-and-forth chat
            </li>
            <li className="waiting">Deck planning next</li>
            <li className="waiting">HTML/PDF/PPTX export next</li>
          </ul>
        </section>
      </aside>

      <section className="studio-main">
        <header className="studio-header">
          <div>
            <p className="eyebrow">Studio Pi Auth MVP</p>
            <h2>Conversation first, decks second.</h2>
          </div>
          <div className="header-actions">
            <ModeSelector
              modes={[
                { id: "chat", label: "Chat" },
                { id: "deck-plan", label: "Deck plan" },
              ]}
              value="chat"
            />
            <ModelPicker
              models={models}
              value={selectedModelId}
              onChange={handleModelChange}
              disabled={!authStatus?.hasAvailableModels}
            />
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}
        {authStatus?.setupHint ? <div className="setup-banner">{authStatus.setupHint}</div> : null}

        <AgentChat
          messages={uiMessages}
          status={conversation.status as ChatStatus}
          onSend={handleSend}
          onStop={handleStop}
          disabled={!authStatus?.hasAvailableModels}
          suggestions={[
            "Help me shape a 7-slide launch deck for an open-source Claude Design alternative.",
            "Before creating slides, ask me the questions you need to plan the deck.",
            "What should the MVP deck narrative be for Studio?",
          ]}
          slots={{
            infoBar: selectedModelId ? (
              <span>
                Model: <strong>{selectedModelId}</strong>
              </span>
            ) : (
              <span>Authenticate a Pi provider to start chatting.</span>
            ),
          }}
        />
      </section>
    </main>
  );
}

function toUiMessage(message: StudioMessage): UIMessage {
  return {
    id: message.id,
    role: message.role === "system" ? "assistant" : message.role,
    parts: [{ type: "text", text: message.content }],
  } as UIMessage;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
