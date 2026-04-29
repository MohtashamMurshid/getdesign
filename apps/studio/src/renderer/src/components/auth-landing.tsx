import { useState } from "react";
import {
  IconCheck,
  IconChevronRight,
  IconKey,
} from "@tabler/icons-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Logo } from "./logo";
import { getProviderLogo } from "../lib/provider-logo";

import type {
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioCustomProviderApi,
} from "../../../shared/studio-api";
import type { OauthCard } from "../studio/oauth-cards";

type ProviderOption = { value: string; label: string };

export function AuthLanding({
  previewMode = false,
  onExitPreview,
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
  onAddCustomProvider,
  customProviderApiOptions,
}: {
  previewMode?: boolean;
  onExitPreview?: () => void;
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
  onAddCustomProvider: (input: StudioAddCustomProviderInput) => Promise<void>;
  customProviderApiOptions: { value: StudioCustomProviderApi; label: string }[];
  onRefresh: () => void;
}) {
  const [showByok, setShowByok] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  return (
    <main className="relative flex min-h-full items-center justify-center overflow-y-auto bg-background px-6 py-12 text-foreground">
      {previewMode && onExitPreview ? (
        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
          <span className="text-muted-foreground">Preview · still signed in</span>
          <button
            type="button"
            onClick={onExitPreview}
            className="font-medium text-foreground hover:underline"
          >
            Exit preview
          </button>
        </div>
      ) : null}
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <Logo size="lg" variant="mark" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-medium tracking-tight">
              Welcome to <span className="text-muted-foreground">get</span>design
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your model provider to continue.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          {oauthProviderCards.length > 0 ? (
            oauthProviderCards.map((oauthProvider) => {
              const logo = getProviderLogo(oauthProvider.id, oauthProvider.name);
              return (
                <button
                  key={oauthProvider.id}
                  type="button"
                  onClick={() => onStartLogin(oauthProvider.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40"
                >
                  {logo ? (
                    <img
                      src={logo.src}
                      alt=""
                      aria-hidden
                      width={18}
                      height={18}
                      className={`shrink-0 select-none object-contain ${logo.monochrome ? "dark:invert" : ""}`}
                      draggable={false}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-foreground/8 text-[10px] font-medium uppercase text-foreground/55"
                    >
                      {oauthProvider.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="flex-1 text-sm font-medium">
                    Continue with {oauthProvider.name}
                  </span>
                  <IconChevronRight
                    size={16}
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
              No providers detected.
            </div>
          )}
        </div>

        {authStatus?.login && authStatus.login.status !== "idle" ? (
          <div className="mt-4">
            <LoginStateCard
              authStatus={authStatus}
              manualCode={manualCode}
              setManualCode={setManualCode}
              onSubmitLoginCode={onSubmitLoginCode}
            />
          </div>
        ) : null}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {showByok ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => {
                    const logo = getProviderLogo(p.value, p.label);
                    return (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          {logo ? (
                            <img
                              src={logo.src}
                              alt=""
                              aria-hidden
                              width={14}
                              height={14}
                              className={`shrink-0 select-none object-contain ${logo.monochrome ? "dark:invert" : ""}`}
                              draggable={false}
                            />
                          ) : null}
                          {p.label}
                        </span>
                      </SelectItem>
                    );
                  })}
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
              size="sm"
            >
              <IconKey size={14} />
              Continue with API key
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowByok(false)}
            >
              Hide API key option
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowByok(true)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            Use your own API key
          </button>
        )}

        <div className="mt-2">
          {showCustom ? (
            <CustomProviderForm
              apiOptions={customProviderApiOptions}
              onSubmit={onAddCustomProvider}
              onCancel={() => setShowCustom(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              Add a custom provider (Ollama, LM Studio, vLLM…)
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Local-first design agent. Tokens stay on your machine.
        </p>
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
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <div>
        <p className="font-medium">
          {authStatus.login.providerName ?? authStatus.login.providerId}
        </p>
        <p className="text-xs text-muted-foreground">
          Status: {authStatus.login.status}
        </p>
        {authStatus.login.instructions ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {authStatus.login.instructions}
          </p>
        ) : null}
      </div>
      {authStatus.login.authUrl ? (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => window.open(authStatus.login?.authUrl, "_blank")}
        >
          Reopen login page
        </Button>
      ) : null}
      {authStatus.login.needsManualCode ? (
        <div className="space-y-2">
          <Label htmlFor="manual-code" className="text-xs">
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
            size="sm"
            className="w-full"
            onClick={onSubmitLoginCode}
            disabled={!manualCode.trim()}
          >
            Submit code
          </Button>
        </div>
      ) : null}
      {authStatus.login.status === "completed" ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <IconCheck size={13} />
          Login completed. Loading models...
        </p>
      ) : null}
      {authStatus.login.error ? (
        <p className="text-xs text-destructive">{authStatus.login.error}</p>
      ) : null}
    </div>
  );
}

function CustomProviderForm({
  apiOptions,
  onSubmit,
  onCancel,
}: {
  apiOptions: { value: StudioCustomProviderApi; label: string }[];
  onSubmit: (input: StudioAddCustomProviderInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [providerId, setProviderId] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [api, setApi] = useState<StudioCustomProviderApi>("openai-completions");
  const [apiKey, setApiKey] = useState("ollama");
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [busy, setBusy] = useState(false);
  const canSubmit =
    providerId.trim() && baseUrl.trim() && apiKey.trim() && modelId.trim() && !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({
        providerId: providerId.trim(),
        baseUrl: baseUrl.trim(),
        api,
        apiKey: apiKey.trim(),
        modelId: modelId.trim(),
        modelName: modelName.trim() || undefined,
      });
    } catch {
      // error surfaces in parent
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-2">
        <Input
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          placeholder="Provider id (e.g. ollama)"
          autoComplete="off"
        />
        <Input
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="Base URL"
        />
        <Select value={api} onValueChange={(v) => setApi(v as StudioCustomProviderApi)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {apiOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="API key"
        />
        <Input
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          placeholder="Model id (e.g. llama3.1:8b)"
        />
        <Input
          value={modelName}
          onChange={(event) => setModelName(event.target.value)}
          placeholder="Display name (optional)"
        />
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        {busy ? "Adding..." : "Add provider"}
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={onCancel}
      >
        Hide custom provider
      </button>
    </div>
  );
}
