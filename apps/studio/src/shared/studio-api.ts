export type StudioChatStatus = "ready" | "submitted" | "streaming" | "error";

export type StudioModelInfo = {
  id: string;
  provider: string;
  name: string;
  label: string;
  contextWindow?: number;
  maxTokens?: number;
};

export type StudioCustomModelRow = {
  providerId: string;
  modelId: string;
  name?: string;
  fullId: string;
};

export type StudioCustomProviderApi =
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai";

export type StudioAddCustomProviderInput = {
  providerId: string;
  baseUrl: string;
  api: StudioCustomProviderApi;
  apiKey: string;
  modelId: string;
  modelName?: string;
};

export type StudioRemoveCustomModelInput = {
  providerId: string;
  modelId: string;
};

export type StudioAddCustomModelInput = {
  providerId: string;
  modelId: string;
  modelName?: string;
};

export type StudioAuthStatus = {
  agentDir: string;
  authFile: string;
  modelsFile: string;
  availableModels: StudioModelInfo[];
  oauthProviders: StudioOAuthProviderInfo[];
  /** Model entries defined under `providers.*.models` in models.json */
  customModels: StudioCustomModelRow[];
  selectedModelId?: string;
  hasAvailableModels: boolean;
  login?: StudioLoginState;
  setupHint?: string;
  /** Present when models.json exists but could not be parsed */
  modelsJsonSyntaxError?: string;
  /** Pi ModelRegistry error after loading models.json (invalid schema, etc.) */
  modelsRegistryError?: string;
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
  parts?: StudioMessagePart[];
  createdAt: number;
  status?: "streaming" | "done" | "error";
};

export type StudioMessagePart = {
  type: string;
  text?: string;
  toolCallId?: string;
  state?: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  result?: unknown;
};

export type StudioConversationSnapshot = {
  id?: string;
  status: StudioChatStatus;
  messages: StudioMessage[];
  selectedModelId?: string;
  currentArtifactId?: string;
  error?: string;
};

export type StudioChatSessionSummary = {
  id: string;
  title: string;
  artifactId: string;
  createdAt: number;
  updatedAt: number;
};

export type StudioRenameChatSessionInput = {
  sessionId: string;
  title: string;
};

export type StudioDeleteChatSessionInput = {
  sessionId: string;
};

export type StudioSendPromptInput = {
  content: string;
  modelId?: string;
};

export type StudioDeckExportFormat = "html" | "pdf" | "pptx";

export type StudioDeckMode = "freeform" | "pptx-safe";

export type StudioDeckSlide = {
  id: string;
  file: string;
  label: string;
  title: string;
};

export type StudioDeckSlideContent = {
  label?: string;
  title: string;
  kicker?: string;
  lede?: string;
  points?: string[];
};

export type StudioDeckProject = {
  id: string;
  title: string;
  mode: StudioDeckMode;
  path: string;
  indexFile: string;
  previewUrl: string;
  createdAt: number;
  updatedAt: number;
  slides: StudioDeckSlide[];
};

export type StudioCreateDeckInput = {
  title?: string;
  mode?: StudioDeckMode;
  slideCount?: number;
  slides?: StudioDeckSlideContent[];
};

export type StudioExportDeckInput = {
  deckId: string;
  format: StudioDeckExportFormat;
};

export type StudioExportDeckResult = {
  format: StudioDeckExportFormat;
  path: string;
  message: string;
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

export type StudioDisconnectProviderInput = {
  providerId: string;
};

export type StudioSubmitLoginCodeInput = {
  code: string;
};

export type StudioEvent =
  | { type: "auth"; payload: StudioAuthStatus }
  | { type: "conversation"; payload: StudioConversationSnapshot }
  | { type: "decks"; payload: StudioDeckProject[] }
  | { type: "sessions"; payload: StudioChatSessionSummary[] };

export type StudioApi = {
  newConversation: () => Promise<StudioConversationSnapshot>;
  getAuthStatus: () => Promise<StudioAuthStatus>;
  setRuntimeApiKey: (input: StudioSetRuntimeKeyInput) => Promise<StudioAuthStatus>;
  startLogin: (input: StudioStartLoginInput) => Promise<StudioAuthStatus>;
  disconnectProvider: (input: StudioDisconnectProviderInput) => Promise<StudioAuthStatus>;
  submitLoginCode: (input: StudioSubmitLoginCodeInput) => Promise<StudioAuthStatus>;
  selectModel: (input: StudioSelectModelInput) => Promise<StudioAuthStatus>;
  getConversation: () => Promise<StudioConversationSnapshot>;
  listChatSessions: () => Promise<StudioChatSessionSummary[]>;
  openChatSession: (sessionId: string) => Promise<StudioConversationSnapshot>;
  renameChatSession: (
    input: StudioRenameChatSessionInput,
  ) => Promise<StudioChatSessionSummary[]>;
  deleteChatSession: (
    input: StudioDeleteChatSessionInput,
  ) => Promise<StudioConversationSnapshot>;
  sendPrompt: (input: StudioSendPromptInput) => Promise<StudioConversationSnapshot>;
  stop: () => Promise<StudioConversationSnapshot>;
  openPiAuthDocs: () => Promise<void>;
  openPiModelsDocs: () => Promise<void>;
  addCustomProvider: (input: StudioAddCustomProviderInput) => Promise<StudioAuthStatus>;
  addCustomModel: (input: StudioAddCustomModelInput) => Promise<StudioAuthStatus>;
  removeCustomModel: (input: StudioRemoveCustomModelInput) => Promise<StudioAuthStatus>;
  listDecks: () => Promise<StudioDeckProject[]>;
  createDeck: (input?: StudioCreateDeckInput) => Promise<StudioDeckProject>;
  getDeck: (deckId: string) => Promise<StudioDeckProject>;
  openDeck: (deckId: string) => Promise<void>;
  exportDeck: (input: StudioExportDeckInput) => Promise<StudioExportDeckResult>;
  onStudioEvent: (listener: (event: StudioEvent) => void) => () => void;
};
