import { useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconCheck,
  IconChevronDown,
  IconCpu,
  IconExternalLink,
  IconKey,
  IconLogout,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import type {
  StudioAddCustomModelInput,
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioCustomModelRow,
  StudioCustomProviderApi,
} from "../../../shared/studio-api";
import type { OauthCard } from "../studio/oauth-cards";
import { getProviderLogo } from "../lib/provider-logo";

function ProviderLogo({
  providerId,
  providerLabel,
  size = 18,
  className,
}: {
  providerId?: string;
  providerLabel?: string;
  size?: number;
  className?: string;
}) {
  const logo = getProviderLogo(providerId, providerLabel);
  if (!logo) {
    return (
      <span
        aria-hidden
        title="Custom model"
        className={`inline-flex shrink-0 items-center justify-center rounded-[4px] bg-foreground/8 text-foreground/55 ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <IconCpu size={Math.round(size * 0.7)} strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <img
      src={logo.src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain ${logo.monochrome ? "dark:invert" : ""} ${className ?? ""}`}
      draggable={false}
    />
  );
}

function AddCustomModelInline({
  providerId,
  onSubmit,
}: {
  providerId: string;
  onSubmit: (input: StudioAddCustomModelInput) => Promise<void>;
}) {
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!modelId.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        providerId,
        modelId: modelId.trim(),
        modelName: modelName.trim() || undefined,
      });
      setModelId("");
      setModelName("");
    } catch {
      /* error surfaces in parent */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={`add-model-id-${providerId}`} className="text-[11px] font-light uppercase tracking-[0.12em] text-muted-foreground">
          Model id
        </Label>
        <Input
          id={`add-model-id-${providerId}`}
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          placeholder="llama3.1:8b"
          onKeyDown={(event) => {
            if (event.key === "Enter" && modelId.trim() && !busy) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={`add-model-name-${providerId}`} className="text-[11px] font-light uppercase tracking-[0.12em] text-muted-foreground">
          Display name (optional)
        </Label>
        <Input
          id={`add-model-name-${providerId}`}
          value={modelName}
          onChange={(event) => setModelName(event.target.value)}
          placeholder="Llama 3.1 8B"
          onKeyDown={(event) => {
            if (event.key === "Enter" && modelId.trim() && !busy) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || !modelId.trim()}
        onClick={() => void handleSubmit()}
      >
        <IconPlus size={14} strokeWidth={1.6} />
        Add model
      </Button>
    </div>
  );
}

function stripProviderPrefix(name: string, providerId?: string): string {
  if (!name) return name;
  const slash = name.indexOf("/");
  if (slash > 0) {
    const prefix = name.slice(0, slash).toLowerCase();
    if (!providerId || prefix === providerId.toLowerCase()) {
      return name.slice(slash + 1);
    }
  }
  return name;
}

type ProviderOption = { value: string; label: string };

type SettingsModelRow = {
  id: string;
  name: string;
  version?: string;
  provider?: string;
  providerLabel?: string;
};

type SettingsPageProps = {
  models: SettingsModelRow[];
  visibleModelIds: string[];
  setVisibleModelIds: (
    updater: string[] | ((current: string[]) => string[]),
  ) => void;
  authStatus: StudioAuthStatus | undefined;
  oauthProviderCards: OauthCard[];
  onStartLogin: (providerId: string) => void;
  onDisconnectProvider: (providerId: string) => void;
  onLogoutAll: () => void;
  onPreviewAuth: () => void;
  onAddCustomProvider: (input: StudioAddCustomProviderInput) => Promise<void>;
  onAddCustomModel: (input: StudioAddCustomModelInput) => Promise<void>;
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
};

export function SettingsPage({
  models,
  visibleModelIds,
  setVisibleModelIds,
  authStatus,
  oauthProviderCards,
  onStartLogin,
  onDisconnectProvider,
  onLogoutAll,
  onPreviewAuth,
  onAddCustomProvider,
  onAddCustomModel,
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
}: SettingsPageProps) {
  const [cpId, setCpId] = useState("");
  const [cpBaseUrl, setCpBaseUrl] = useState("http://localhost:11434/v1");
  const [cpApi, setCpApi] =
    useState<StudioCustomProviderApi>("openai-completions");
  const [cpApiKey, setCpApiKey] = useState("ollama");
  const [cpModelId, setCpModelId] = useState("");
  const [cpModelName, setCpModelName] = useState("");
  const [customFormBusy, setCustomFormBusy] = useState(false);

  const modelsByProviderId = useMemo(() => {
    const buckets = new Map<string, SettingsModelRow[]>();
    for (const model of models) {
      const key = model.provider ?? "unknown";
      const list = buckets.get(key);
      if (list) list.push(model);
      else buckets.set(key, [model]);
    }
    return buckets;
  }, [models]);

  function modelsForProvider(providerId: string): SettingsModelRow[] {
    const exact = modelsByProviderId.get(providerId);
    if (exact && exact.length > 0) return exact;
    // Fall back to a fuzzy match (e.g. `gemini` against `gemini-cli`)
    const out: SettingsModelRow[] = [];
    for (const [key, list] of modelsByProviderId.entries()) {
      if (
        key === providerId ||
        key.includes(providerId) ||
        providerId.includes(key)
      ) {
        out.push(...list);
      }
    }
    return out;
  }

  const customProvidersGrouped = useMemo(() => {
    const buckets = new Map<
      string,
      { providerId: string; rows: StudioCustomModelRow[] }
    >();
    for (const row of authStatus?.customModels ?? []) {
      const cur = buckets.get(row.providerId);
      if (cur) cur.rows.push(row);
      else buckets.set(row.providerId, { providerId: row.providerId, rows: [row] });
    }
    return [...buckets.values()].sort((a, b) =>
      a.providerId.localeCompare(b.providerId, undefined, {
        sensitivity: "base",
      }),
    );
  }, [authStatus?.customModels]);

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
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
              <IconArrowLeft size={18} strokeWidth={1.5} />
            </Button>
            <div>
              <p className="text-[10px] font-light uppercase tracking-[0.18em] text-muted-foreground">
                Studio
              </p>
              <h1 className="text-base font-normal">Agent settings</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <IconRefresh size={15} strokeWidth={1.5} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
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
            <CardTitle className="text-base">Connected providers</CardTitle>
            <CardDescription>
              Studio stores Pi subscription OAuth and API keys in{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {authStatus?.authFile ?? "Studio auth.json"}
              </code>
              . Expand a provider to choose which of its models appear in the
              picker. Disconnect clears that provider the same way Pi&apos;s{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                /logout
              </code>{" "}
              command does.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {oauthProviderCards.length === 0 &&
            customProvidersGrouped.length === 0 ? (
              <p className="text-sm font-light text-muted-foreground">
                No providers detected.
              </p>
            ) : null}
            {oauthProviderCards.map((p) => {
                const providerModels = modelsForProvider(p.id);
                const authed = providerModels.length > 0;
                const visibleHere = providerModels.filter(
                  (m) =>
                    visibleModelIds.length === 0 ||
                    visibleModelIds.includes(m.id),
                ).length;
                return (
                  <details
                    key={p.id}
                    className="group/prov border-b border-border last:border-b-0 [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 py-3 outline-none transition-colors hover:bg-muted/30 -mx-1 px-1 rounded-md">
                      <div className="flex min-w-0 items-center gap-3">
                        <IconChevronDown
                          size={14}
                          strokeWidth={1.5}
                          className="shrink-0 text-muted-foreground transition-transform group-open/prov:rotate-180"
                        />
                        <ProviderLogo
                          providerId={p.id}
                          providerLabel={p.name}
                          size={20}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-normal">
                            {p.name}
                          </p>
                          <p className="truncate text-xs font-light text-muted-foreground">
                            {p.description}
                            {authed
                              ? ` · ${visibleHere} of ${providerModels.length} visible`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex shrink-0 flex-wrap items-center justify-end gap-2"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        {authed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-light text-muted-foreground">
                            <IconCheck size={12} strokeWidth={1.6} />
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
                    </summary>

                    <div className="pb-3 pl-9 pr-1">
                      {providerModels.length === 0 ? (
                        <p className="py-2 text-xs font-light text-muted-foreground">
                          No models available. Connect this provider to see its
                          models here.
                        </p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {providerModels.map((model) => {
                            const checked =
                              visibleModelIds.length === 0 ||
                              visibleModelIds.includes(model.id);
                            return (
                              <li key={model.id}>
                                <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5 transition-colors hover:bg-muted/30">
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-normal">
                                      {stripProviderPrefix(
                                        model.name,
                                        model.provider,
                                      )}
                                    </span>
                                    <span className="block truncate text-xs font-light text-muted-foreground">
                                      {model.id}
                                      {model.version
                                        ? ` · ${model.version}`
                                        : ""}
                                    </span>
                                  </span>
                                  <input
                                    type="checkbox"
                                    className="size-4 accent-foreground"
                                    checked={checked}
                                    onChange={(event) =>
                                      toggleModel(
                                        model.id,
                                        event.target.checked,
                                      )
                                    }
                                  />
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </details>
                );
              })}

            {customProvidersGrouped.map((group) => {
              const providerLabel = group.providerId;
              return (
                <details
                  key={`custom-${group.providerId}`}
                  className="group/prov border-b border-border last:border-b-0 [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="-mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-3 outline-none transition-colors hover:bg-muted/30">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className="shrink-0 text-muted-foreground transition-transform group-open/prov:rotate-180"
                      />
                      <ProviderLogo
                        providerId={group.providerId}
                        providerLabel={providerLabel}
                        size={20}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-normal">
                          {providerLabel}
                        </p>
                        <p className="truncate text-xs font-light text-muted-foreground">
                          Custom · {group.rows.length}{" "}
                          {group.rows.length === 1 ? "model" : "models"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-light text-muted-foreground">
                      <IconCpu size={12} strokeWidth={1.6} />
                      Local
                    </span>
                  </summary>

                  <div className="pb-3 pl-9 pr-1">
                    <ul className="divide-y divide-border">
                      {group.rows.map((row) => {
                        const checked =
                          visibleModelIds.length === 0 ||
                          visibleModelIds.includes(row.fullId);
                        return (
                          <li key={`${row.providerId}/${row.modelId}`}>
                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-normal">
                                    {row.name ?? row.modelId}
                                  </span>
                                  <span className="block truncate text-xs font-light text-muted-foreground">
                                    {row.fullId}
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  className="size-4 accent-foreground"
                                  checked={checked}
                                  onChange={(event) =>
                                    toggleModel(row.fullId, event.target.checked)
                                  }
                                />
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  void removeCustomModelRow(
                                    row.providerId,
                                    row.modelId,
                                  )
                                }
                                aria-label={`Remove ${row.fullId}`}
                              >
                                <IconTrash size={15} strokeWidth={1.5} />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <AddCustomModelInline
                      providerId={group.providerId}
                      onSubmit={onAddCustomModel}
                    />
                  </div>
                </details>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={window.api.openPiAuthDocs}
            >
              <IconExternalLink size={14} />
              Open Pi auth docs
            </Button>
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
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-normal">
                <IconCpu size={14} strokeWidth={1.6} className="text-muted-foreground" />
                Add provider &amp; model
              </p>
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

            <p className="text-xs font-light text-muted-foreground">
              Added entries appear under{" "}
              <span className="text-foreground/70">Connected providers</span>{" "}
              above, where you can toggle visibility or remove individual
              models.
            </p>

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
              Sign out of every connected provider. This clears OAuth tokens
              and runtime API keys from Pi&apos;s auth storage and returns you
              to the welcome screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onLogoutAll}
            >
              <IconLogout size={15} />
              Sign out of everything
            </Button>
            {import.meta.env.DEV ? (
              <Button variant="ghost" size="sm" onClick={onPreviewAuth}>
                Preview login screen
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={window.api.openPiAuthDocs}>
              <IconExternalLink size={14} />
              Pi auth reference
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
