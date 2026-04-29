import type {
  StudioAddCustomModelInput,
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioCustomProviderApi,
} from "../../../../shared/studio-api";
import type { OauthCard } from "../../studio/oauth-cards";

export type ProviderOption = { value: string; label: string };

export type SettingsModelRow = {
  id: string;
  name: string;
  version?: string;
  provider?: string;
  providerLabel?: string;
};

export type SettingsPageProps = {
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
  onAddCustomProvider: (
    input: StudioAddCustomProviderInput,
  ) => Promise<void>;
  onAddCustomModel: (input: StudioAddCustomModelInput) => Promise<void>;
  onRemoveCustomModel: (providerId: string, modelId: string) => Promise<void>;
  customProviderApiOptions: {
    value: StudioCustomProviderApi;
    label: string;
  }[];
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
