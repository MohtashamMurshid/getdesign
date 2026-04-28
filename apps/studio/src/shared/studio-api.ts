export type StudioChatStatus = "ready" | "submitted" | "streaming" | "error";

export type StudioModelInfo = {
  id: string;
  provider: string;
  name: string;
  label: string;
  contextWindow?: number;
  maxTokens?: number;
};

export type StudioAuthStatus = {
  agentDir: string;
  authFile: string;
  modelsFile: string;
  availableModels: StudioModelInfo[];
  oauthProviders: StudioOAuthProviderInfo[];
  selectedModelId?: string;
  hasAvailableModels: boolean;
  login?: StudioLoginState;
  setupHint?: string;
};

export type StudioOAuthProviderInfo = {
  id: string;
  name: string;
};

export type StudioLoginState = {
  status: "idle" | "starting" | "waiting" | "completed" | "error";
  providerId?: string;
  providerName?: string;
  authUrl?: string;
  instructions?: string;
  progress?: string[];
  needsManualCode?: boolean;
  promptMessage?: string;
  error?: string;
};

export type StudioMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  status?: "streaming" | "done" | "error";
};

export type StudioConversationSnapshot = {
  status: StudioChatStatus;
  messages: StudioMessage[];
  selectedModelId?: string;
  error?: string;
};

export type StudioSendPromptInput = {
  content: string;
  modelId?: string;
};

export type StudioSetRuntimeKeyInput = {
  provider: string;
  apiKey: string;
};

export type StudioSelectModelInput = {
  modelId: string;
};

export type StudioStartLoginInput = {
  providerId: string;
};

export type StudioSubmitLoginCodeInput = {
  code: string;
};

export type StudioEvent =
  | { type: "auth"; payload: StudioAuthStatus }
  | { type: "conversation"; payload: StudioConversationSnapshot };

export type StudioApi = {
  getAuthStatus: () => Promise<StudioAuthStatus>;
  setRuntimeApiKey: (input: StudioSetRuntimeKeyInput) => Promise<StudioAuthStatus>;
  startLogin: (input: StudioStartLoginInput) => Promise<StudioAuthStatus>;
  submitLoginCode: (input: StudioSubmitLoginCodeInput) => Promise<StudioAuthStatus>;
  selectModel: (input: StudioSelectModelInput) => Promise<StudioAuthStatus>;
  getConversation: () => Promise<StudioConversationSnapshot>;
  sendPrompt: (input: StudioSendPromptInput) => Promise<StudioConversationSnapshot>;
  stop: () => Promise<StudioConversationSnapshot>;
  openPiAuthDocs: () => Promise<void>;
  onStudioEvent: (listener: (event: StudioEvent) => void) => () => void;
};
