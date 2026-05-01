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
  darwinTrafficLightInset = false,
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
  cursorAuth,
  cursorApiKeyDraft,
  setCursorApiKeyDraft,
  cursorBusy,
  cursorError,
  onCursorLogin,
  onCursorLogout,
  onOpenCursorDashboard,
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
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsHeader
          darwinTrafficLightInset={darwinTrafficLightInset}
          onBack={onBack}
          onRefresh={onRefresh}
        />

        <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-6">
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
              cursorAuth={cursorAuth}
              cursorApiKeyDraft={cursorApiKeyDraft}
              setCursorApiKeyDraft={setCursorApiKeyDraft}
              cursorBusy={cursorBusy}
              cursorError={cursorError}
              onCursorLogin={onCursorLogin}
              onCursorLogout={onCursorLogout}
              onOpenCursorDashboard={onOpenCursorDashboard}
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
        </div>
      </div>
    </main>
  );
}
