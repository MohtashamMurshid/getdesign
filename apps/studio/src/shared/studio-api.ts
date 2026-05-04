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

/**
 * Inline chat representation of a deck-plan.json on disk. Created by the main
 * process when the watcher observes a new or changed plan; mutated in place on
 * status-only changes (pending → confirmed) and superseded when the plan
 * content hash changes.
 */
export type StudioDeckPlanCardData = {
  artifactId: string;
  artifactPath: string;
  /** Stable hash over the plan's content fields (audience/keyMessage/etc).
   * Used to distinguish status-only writes from content rewrites. */
  contentHash: string;
  plan: StudioDeckPlan;
  /** True if a newer plan card with a different contentHash exists in this
   * thread. Renderer dims superseded cards. */
  superseded?: boolean;
};

/** Thin one-line system note appended after the user clicks Confirm in chat. */
export type StudioPlanConfirmedNoteData = {
  artifactId: string;
  confirmedAt: number;
};

export const STUDIO_DECK_PLAN_PART_TYPE = "studio:deck-plan" as const;
export const STUDIO_PLAN_CONFIRMED_PART_TYPE = "studio:plan-confirmed" as const;
/** Marker on a user message that the chat UI should NOT render — the message
 * still carries real content sent to the model (used for system-injected
 * follow-up prompts like "plan confirmed, proceed"). */
export const STUDIO_HIDDEN_PROMPT_PART_TYPE = "studio:hidden-prompt" as const;

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
  /** When true, the user message is recorded in chat history (so the agent
   * sees it on session reload) but tagged with STUDIO_HIDDEN_PROMPT_PART_TYPE
   * so the renderer skips it. Used for auto-resume after plan confirm. */
  hidden?: boolean;
};

export type StudioDeckExportFormat = "html" | "pdf" | "pptx";

export type StudioDeckMode = "freeform" | "pptx-safe";

export type StudioDeckExportPath = "html" | "html-pdf" | "pptx";

export type StudioDeckPlanStatus = "pending" | "confirmed";

/**
 * Lightweight pre-build plan that the agent records and the user confirms
 * before slide files are written. Stored in `deck-plan.json` at the artifact
 * root and surfaced to the renderer for explicit confirmation.
 */
export type StudioDeckPlan = {
  audience: string;
  keyMessage: string;
  exportPath: StudioDeckExportPath;
  slideCount: number;
  mode: StudioDeckMode;
  notes?: string;
  status: StudioDeckPlanStatus;
  createdAt: number;
  confirmedAt?: number;
};

export type StudioDeckPlanInput = {
  audience: string;
  keyMessage: string;
  exportPath: StudioDeckExportPath;
  slideCount: number;
  mode: StudioDeckMode;
  notes?: string;
  status?: StudioDeckPlanStatus;
};

export type StudioDeckTweaks = {
  theme?: "default" | "light" | "dark" | "warm" | "cool";
  density?: "comfortable" | "compact" | "spacious";
  imageStyle?: "default" | "muted" | "vivid";
};

export type StudioDeckSlide = {
  id: string;
  file: string;
  label: string;
  title: string;
  /** Speaker notes for this slide. Sourced from deck.json or `<aside class="notes">`. */
  notes?: string;
};

export type StudioDeckSlideContent = {
  label?: string;
  title: string;
  kicker?: string;
  lede?: string;
  points?: string[];
  notes?: string;
};

export type StudioDeckTemplateSummary = {
  id: string;
  title: string;
  description: string;
  slideCount: number;
  mode: StudioDeckMode;
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
  /** Required-but-lightweight plan that gates exports when present. */
  plan?: StudioDeckPlan;
  /** Optional manifest-level tweak controls applied via injected CSS variables. */
  tweaks?: StudioDeckTweaks;
};

export type StudioCreateDeckInput = {
  title?: string;
  mode?: StudioDeckMode;
  slideCount?: number;
  slides?: StudioDeckSlideContent[];
  templateId?: string;
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

export type StudioDeckVerificationIssue = {
  level: "error" | "warning";
  slide?: string;
  message: string;
};

export type StudioDeckVerificationResult = {
  ok: boolean;
  issues: StudioDeckVerificationIssue[];
  checkedAt: number;
};

export type StudioSaveDeckPlanInput = {
  deckId: string;
  plan: StudioDeckPlanInput;
};

export type StudioConfirmDeckPlanInput = {
  deckId: string;
};

export type StudioApplyDeckTweaksInput = {
  deckId: string;
  tweaks: StudioDeckTweaks;
};

export type StudioCreateDeckFromTemplateInput = {
  templateId: string;
  title?: string;
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

export type StudioCursorAccount = {
  apiKeyName: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userId?: number;
  createdAt?: string;
};

export type StudioCursorModel = {
  id: string;
  displayName: string;
  description?: string;
};

export type StudioCursorAuthStatus = {
  /** True when an API key is stored and last validation succeeded. */
  signedIn: boolean;
  /** Authenticated user details from `Cursor.me()`, when available. */
  account?: StudioCursorAccount;
  /** Last login error surfaced to the UI. */
  error?: string;
  /** Local fingerprint of the stored key (e.g. `cursor_***abcd`) for display. */
  apiKeyHint?: string;
  /** Lifecycle of the in-progress login flow. */
  status: "idle" | "verifying" | "ready" | "error";
  /** Models available to the authenticated user (`Cursor.models.list()`). */
  models?: StudioCursorModel[];
};

export type StudioCursorLoginInput = {
  apiKey: string;
};

export type StudioEvent =
  | { type: "auth"; payload: StudioAuthStatus }
  | { type: "conversation"; payload: StudioConversationSnapshot }
  | { type: "decks"; payload: StudioDeckProject[] }
  | { type: "sessions"; payload: StudioChatSessionSummary[] }
  | { type: "cursor-auth"; payload: StudioCursorAuthStatus };

export type StudioApi = {
  newConversation: () => Promise<StudioConversationSnapshot>;
  getAuthStatus: () => Promise<StudioAuthStatus>;
  setRuntimeApiKey: (input: StudioSetRuntimeKeyInput) => Promise<StudioAuthStatus>;
  startLogin: (input: StudioStartLoginInput) => Promise<StudioAuthStatus>;
  disconnectProvider: (input: StudioDisconnectProviderInput) => Promise<StudioAuthStatus>;
  logoutAll: () => Promise<StudioAuthStatus>;
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
  revealPath: (path: string) => Promise<void>;
  exportDeck: (input: StudioExportDeckInput) => Promise<StudioExportDeckResult>;
  saveDeckPlan: (input: StudioSaveDeckPlanInput) => Promise<StudioDeckProject>;
  confirmDeckPlan: (input: StudioConfirmDeckPlanInput) => Promise<StudioDeckProject>;
  applyDeckTweaks: (input: StudioApplyDeckTweaksInput) => Promise<StudioDeckProject>;
  verifyDeck: (deckId: string) => Promise<StudioDeckVerificationResult>;
  listDeckTemplates: () => Promise<StudioDeckTemplateSummary[]>;
  createDeckFromTemplate: (
    input: StudioCreateDeckFromTemplateInput,
  ) => Promise<StudioDeckProject>;
  getCursorAuth: () => Promise<StudioCursorAuthStatus>;
  cursorLogin: (input: StudioCursorLoginInput) => Promise<StudioCursorAuthStatus>;
  cursorLogout: () => Promise<StudioCursorAuthStatus>;
  openCursorDashboard: () => Promise<void>;
  onStudioEvent: (listener: (event: StudioEvent) => void) => () => void;
};
