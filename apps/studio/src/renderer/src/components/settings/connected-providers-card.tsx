import { useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconCpu,
  IconExternalLink,
  IconKey,
  IconTrash,
} from "@tabler/icons-react";

import { formatModelPickerLabel } from "@/lib/format-model-label";

import { AddCustomModelInline } from "./add-custom-model-inline";
import { SettingsProviderLogo } from "./settings-provider-logo";
import { modelsForProvider } from "./settings-utils";
import type { SettingsModelRow } from "./settings-types";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";

import type {
  StudioAuthStatus,
  StudioCursorAuthStatus,
  StudioCustomModelRow,
  StudioAddCustomModelInput,
} from "../../../../shared/studio-api";
import type { OauthCard } from "../../studio/oauth-cards";

type CustomProviderGroup = {
  providerId: string;
  rows: StudioCustomModelRow[];
};

export type ConnectedProvidersCardProps = {
  authStatus: StudioAuthStatus | undefined;
  oauthProviderCards: OauthCard[];
  customProvidersGrouped: CustomProviderGroup[];
  modelsByProviderId: Map<string, SettingsModelRow[]>;
  visibleModelIds: string[];
  onToggleModel: (id: string, checked: boolean) => void;
  onStartLogin: (providerId: string) => void;
  onDisconnectProvider: (providerId: string) => void;
  onAddCustomModel: (input: StudioAddCustomModelInput) => Promise<void>;
  onRemoveCustomModel: (providerId: string, modelId: string) => Promise<void>;
  cursorAuth: StudioCursorAuthStatus;
  cursorApiKeyDraft: string;
  setCursorApiKeyDraft: (value: string) => void;
  cursorBusy: boolean;
  cursorError?: string;
  onCursorLogin: () => void;
  onCursorLogout: () => void;
  onOpenCursorDashboard: () => void;
};

export function ConnectedProvidersCard({
  authStatus,
  oauthProviderCards,
  customProvidersGrouped,
  modelsByProviderId,
  visibleModelIds,
  onToggleModel,
  onStartLogin,
  onDisconnectProvider,
  onAddCustomModel,
  onRemoveCustomModel,
  cursorAuth,
  cursorApiKeyDraft,
  setCursorApiKeyDraft,
  cursorBusy,
  cursorError,
  onCursorLogin,
  onCursorLogout,
  onOpenCursorDashboard,
}: ConnectedProvidersCardProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-normal tracking-tight">
          Connected providers
        </CardTitle>
        <CardDescription className="font-light leading-relaxed">
          Studio stores Pi subscription OAuth and API keys in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {authStatus?.authFile ?? "Studio auth.json"}
          </code>
          . Expand a provider to choose which of its models appear in the
          picker. Disconnect clears that provider the same way Pi&apos;s{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/logout</code>{" "}
          command does.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {oauthProviderCards.length === 0 && customProvidersGrouped.length === 0 ? (
          <p className="text-sm font-light text-muted-foreground">
            No providers detected.
          </p>
        ) : null}

        <CursorProviderRow
          cursorAuth={cursorAuth}
          apiKeyDraft={cursorApiKeyDraft}
          setApiKeyDraft={setCursorApiKeyDraft}
          busy={cursorBusy}
          error={cursorError}
          onLogin={onCursorLogin}
          onLogout={onCursorLogout}
          onOpenDashboard={onOpenCursorDashboard}
          models={modelsForProvider(modelsByProviderId, "cursor")}
          visibleModelIds={visibleModelIds}
          onToggleModel={onToggleModel}
        />

        {oauthProviderCards.map((p) => {
          const providerModels = modelsForProvider(modelsByProviderId, p.id);
          const authed = providerModels.length > 0;
          const visibleHere = providerModels.filter(
            (m) =>
              visibleModelIds.length === 0 || visibleModelIds.includes(m.id),
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
                  <SettingsProviderLogo
                    providerId={p.id}
                    providerLabel={p.name}
                    size={20}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-normal">{p.name}</p>
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
                                {formatModelPickerLabel(
                                  model.name,
                                  model.provider,
                                )}
                              </span>
                              <span className="block truncate text-xs font-light text-muted-foreground">
                                {model.id}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              className="size-4 accent-foreground"
                              checked={checked}
                              onChange={(event) =>
                                onToggleModel(model.id, event.target.checked)
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
                  <SettingsProviderLogo
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
                                onToggleModel(row.fullId, event.target.checked)
                              }
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              void onRemoveCustomModel(
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
  );
}

function CursorProviderRow({
  cursorAuth,
  apiKeyDraft,
  setApiKeyDraft,
  busy,
  error,
  onLogin,
  onLogout,
  onOpenDashboard,
  models,
  visibleModelIds,
  onToggleModel,
}: {
  cursorAuth: StudioCursorAuthStatus;
  apiKeyDraft: string;
  setApiKeyDraft: (value: string) => void;
  busy: boolean;
  error?: string;
  onLogin: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  models: SettingsModelRow[];
  visibleModelIds: string[];
  onToggleModel: (id: string, checked: boolean) => void;
}) {
  const [showKeyForm, setShowKeyForm] = useState(false);
  const account = cursorAuth.account;
  const authed = cursorAuth.signedIn;
  const displayName =
    account?.userFirstName || account?.userLastName
      ? [account?.userFirstName, account?.userLastName]
          .filter(Boolean)
          .join(" ")
      : undefined;
  const visibleHere = models.filter(
    (m) => visibleModelIds.length === 0 || visibleModelIds.includes(m.id),
  ).length;
  const subtitle = authed
    ? `${displayName ?? account?.userEmail ?? "Personal API key"}${
        models.length > 0
          ? ` · ${visibleHere} of ${models.length} visible`
          : ""
      }`
    : "Personal API key from cursor.com";

  return (
    <details className="group/prov border-b border-border last:border-b-0 [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden">
      <summary className="-mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-3 outline-none transition-colors hover:bg-muted/30">
        <div className="flex min-w-0 items-center gap-3">
          <IconChevronDown
            size={14}
            strokeWidth={1.5}
            className="shrink-0 text-muted-foreground transition-transform group-open/prov:rotate-180"
          />
          <SettingsProviderLogo
            providerId="cursor"
            providerLabel="Cursor"
            size={20}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-normal">Cursor</p>
            <p className="truncate text-xs font-light text-muted-foreground">
              {subtitle}
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
              onClick={onLogout}
              disabled={busy}
            >
              Disconnect
            </Button>
          ) : null}
          <Button
            variant={authed ? "ghost" : "outline"}
            size="sm"
            onClick={() => setShowKeyForm((value) => !value)}
            disabled={busy}
          >
            {authed ? "Reconnect" : showKeyForm ? "Hide" : "Connect"}
          </Button>
        </div>
      </summary>

      <div className="space-y-3 pb-3 pl-9 pr-1">
        {showKeyForm || !authed ? (
          <div className="space-y-3">
            <p className="text-xs font-light text-muted-foreground">
              Paste a personal API key from{" "}
              <button
                type="button"
                onClick={onOpenDashboard}
                className="text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                cursor.com/dashboard/integrations
              </button>
              . The key is stored locally on this device (encrypted when available).
            </p>
            <Input
              type="password"
              aria-label="Cursor API key"
              value={apiKeyDraft}
              onChange={(event) => setApiKeyDraft(event.target.value)}
              placeholder="cursor_..."
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onLogin();
                  setShowKeyForm(false);
                }}
                disabled={!apiKeyDraft.trim() || busy}
              >
                <IconKey size={14} />
                {busy ? "Verifying..." : authed ? "Update key" : "Connect Cursor"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenDashboard}
                disabled={busy}
              >
                <IconExternalLink size={14} />
                Get an API key
              </Button>
            </div>
          </div>
        ) : null}

        {authed ? (
          models.length === 0 ? (
            <p className="py-2 text-xs font-light text-muted-foreground">
              No Cursor models found for this API key. Try reconnecting after
              enabling models in your Cursor account.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {models.map((model) => {
                const checked =
                  visibleModelIds.length === 0 ||
                  visibleModelIds.includes(model.id);
                return (
                  <li key={model.id}>
                    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5 transition-colors hover:bg-muted/30">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-normal">
                          {model.name}
                        </span>
                        <span className="block truncate text-xs font-light text-muted-foreground">
                          {model.id}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        className="size-4 accent-foreground"
                        checked={checked}
                        onChange={(event) =>
                          onToggleModel(model.id, event.target.checked)
                        }
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </div>
    </details>
  );
}
