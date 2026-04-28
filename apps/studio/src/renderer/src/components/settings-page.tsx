import { useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconCheck,
  IconExternalLink,
  IconKey,
  IconLogout,
  IconRefresh,
  IconSearch,
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
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioCustomProviderApi,
} from "../../../shared/studio-api";
import type { OauthCard } from "../studio/oauth-cards";

type ProviderOption = { value: string; label: string };

type SettingsPageProps = {
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
};

export function SettingsPage({
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
}: SettingsPageProps) {
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
                  setVisibleModelIds(models.length > 0 ? [models[0].id] : [])
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
