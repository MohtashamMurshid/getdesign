import {
  IconCheck,
  IconChevronDown,
  IconCpu,
  IconExternalLink,
  IconTrash,
} from "@tabler/icons-react";

import { stripProviderPrefix } from "@/lib/format-model-label";

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

import type {
  StudioAuthStatus,
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
}: ConnectedProvidersCardProps) {
  return (
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
                                {stripProviderPrefix(model.name, model.provider)}
                              </span>
                              <span className="block truncate text-xs font-light text-muted-foreground">
                                {model.id}
                                {model.version ? ` · ${model.version}` : ""}
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
