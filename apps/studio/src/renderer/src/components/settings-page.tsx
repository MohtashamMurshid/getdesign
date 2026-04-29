import { useMemo } from "react";

import type { StudioCustomModelRow } from "../../../shared/studio-api";

import { ByokCard, SessionCard } from "./settings/byok-and-session-cards";
import { ConnectedProvidersCard } from "./settings/connected-providers-card";
import { CustomModelsCard } from "./settings/custom-models-card";
import { SettingsHeader } from "./settings/settings-header";
import { SettingsStatusAlerts } from "./settings/settings-status-alerts";
import { buildModelsByProviderId } from "./settings/settings-utils";
import type { SettingsPageProps } from "./settings/settings-types";

export type { SettingsPageProps } from "./settings/settings-types";

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
  const modelsByProviderId = useMemo(
    () => buildModelsByProviderId(models),
    [models],
  );

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

  return (
    <main className="min-h-full overflow-y-auto bg-background text-foreground">
      <SettingsHeader onBack={onBack} onRefresh={onRefresh} />

      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
        <SettingsStatusAlerts error={error} authStatus={authStatus} />

        <ConnectedProvidersCard
          authStatus={authStatus}
          oauthProviderCards={oauthProviderCards}
          customProvidersGrouped={customProvidersGrouped}
          modelsByProviderId={modelsByProviderId}
          visibleModelIds={visibleModelIds}
          onToggleModel={toggleModel}
          onStartLogin={onStartLogin}
          onDisconnectProvider={onDisconnectProvider}
          onAddCustomModel={onAddCustomModel}
          onRemoveCustomModel={onRemoveCustomModel}
        />

        <CustomModelsCard
          customProviderApiOptions={customProviderApiOptions}
          onAddCustomProvider={onAddCustomProvider}
        />

        <ByokCard
          provider={provider}
          setProvider={setProvider}
          providers={providers}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onRuntimeKey={onRuntimeKey}
        />

        <SessionCard onLogoutAll={onLogoutAll} onPreviewAuth={onPreviewAuth} />
      </div>
    </main>
  );
}
