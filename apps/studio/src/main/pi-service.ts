import { app, BrowserWindow, ipcMain, shell } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  StudioAddCustomModelInput,
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioChatSessionSummary,
  StudioCreateDeckInput,
  StudioConversationSnapshot,
  StudioCustomModelRow,
  StudioDeckProject,
  StudioEvent,
  StudioExportDeckInput,
  StudioExportDeckResult,
  StudioLoginState,
  StudioMessage,
  StudioMessagePart,
  StudioModelInfo,
  StudioOAuthProviderInfo,
  StudioDeleteChatSessionInput,
  StudioRemoveCustomModelInput,
  StudioRenameChatSessionInput,
  StudioSelectModelInput,
  StudioSendPromptInput,
  StudioStartLoginInput,
  StudioDisconnectProviderInput,
  StudioSubmitLoginCodeInput,
  StudioSetRuntimeKeyInput,
} from "../shared/studio-api";
import {
  addCustomModelEntry,
  addCustomProviderEntry,
  listCustomModelRows,
  readModelsJson,
  removeCustomModelEntry,
  writeModelsJson,
} from "./models-json";
import { StudioDeckService } from "./deck-service";

type PiCodingAgent = typeof import("@mariozechner/pi-coding-agent");
type PiAi = typeof import("@mariozechner/pi-ai");
type PiSession = {
  prompt: (text: string) => Promise<void>;
  abort: () => Promise<void>;
  dispose: () => void;
  subscribe: (listener: (event: PiSessionEvent) => void) => () => void;
  setModel?: (model: unknown) => Promise<void>;
  model?: unknown;
};
type PiSessionEvent = {
  type: string;
  message?: unknown;
  assistantMessageEvent?: {
    type: string;
    delta?: string;
    text?: string;
    content?: string;
    toolCall?: unknown;
    partial?: unknown;
  };
  messages?: unknown[];
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  partialResult?: unknown;
  result?: unknown;
  isError?: boolean;
};

type PiRuntime = {
  authStorage: {
    setRuntimeApiKey: (provider: string, apiKey: string) => void;
    removeRuntimeApiKey: (provider: string) => void;
    logout: (provider: string) => void;
    login: (
      providerId: string,
      callbacks: {
        onAuth: (info: { url: string; instructions?: string }) => void;
        onPrompt: (prompt: { message: string; placeholder?: string; allowEmpty?: boolean }) => Promise<string>;
        onProgress?: (message: string) => void;
        onManualCodeInput?: () => Promise<string>;
      },
    ) => Promise<void>;
    getOAuthProviders?: () => Array<{ id: string; name: string }>;
  };
  modelRegistry: {
    getAvailable: () => unknown[] | Promise<unknown[]>;
    find?: (provider: string, id: string) => unknown;
    refresh?: () => void;
    getError?: () => string | undefined;
  };
  selectedModel?: unknown;
  selectedModelId?: string;
  session?: PiSession;
  unsubscribe?: () => void;
};

const PI_PROVIDER_ENV_KEYS = [
  "AI_GATEWAY_API_KEY",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_OAUTH_TOKEN",
  "AWS_ACCESS_KEY_ID",
  "AWS_BEARER_TOKEN_BEDROCK",
  "AWS_CONTAINER_CREDENTIALS_FULL_URI",
  "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
  "AWS_PROFILE",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_WEB_IDENTITY_TOKEN_FILE",
  "AZURE_OPENAI_API_KEY",
  "CEREBRAS_API_KEY",
  "COPILOT_GITHUB_TOKEN",
  "DEEPSEEK_API_KEY",
  "FIREWORKS_API_KEY",
  "GCLOUD_PROJECT",
  "GEMINI_API_KEY",
  "GH_TOKEN",
  "GITHUB_TOKEN",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_API_KEY",
  "GOOGLE_CLOUD_LOCATION",
  "GOOGLE_CLOUD_PROJECT",
  "GROQ_API_KEY",
  "HF_TOKEN",
  "KIMI_API_KEY",
  "MINIMAX_API_KEY",
  "MINIMAX_CN_API_KEY",
  "MISTRAL_API_KEY",
  "OPENCODE_API_KEY",
  "OPENAI_API_KEY",
  "OPENROUTER_API_KEY",
  "XAI_API_KEY",
  "ZAI_API_KEY",
] as const;

const PI_AUTH_DOCS_URL = "https://pi.dev/docs/latest/providers";
const PI_MODELS_DOCS_URL = "https://pi.dev/docs/latest/models";
const STUDIO_SYSTEM_PROMPT = [
  "You are Studio, an open-source Claude Design-style design partner.",
  "For slide and PPT work, follow Studio's HTML-first deck workflow.",
  "Always treat the browser-ready HTML deck as the source artifact; PDF and PPTX are exports.",
  "For decks, create files in the current artifact workspace using Pi file tools. Never paste full deck HTML in chat.",
  "Write the browser preview to index.html. For multi-slide decks, create slides/*.html and an index.html manifest/iframe stage.",
  "Use shared/tokens.css for reusable design tokens and assets/ for local assets.",
  "Before creating a deck, ask which export path matters: HTML only, HTML plus PDF, or editable PPTX.",
  "For decks with five or more slides, create or propose two showcase slides first to lock the visual grammar before producing the full deck.",
  "Editable PPTX requires pptx-safe authoring from the first slide: fixed 16:9 layout, text only in p/heading/list tags, real img tags, backgrounds/borders on wrapper elements only, no gradients, no web components, and no complex SVG.",
  "If the user asks for editable PowerPoint, prioritize clean layout primitives that can become native PPT text boxes, shapes, and images.",
  "When you finish, summarize the files you created or edited and tell the user the preview is visible in the right panel.",
].join("\n");

let runtimePromise: Promise<PiRuntime> | undefined;
let mainWindow: BrowserWindow | undefined;
let currentSessionId = createId("session");
let messages: StudioMessage[] = [];
let status: StudioConversationSnapshot["status"] = "ready";
let lastError: string | undefined;
let loginState: StudioLoginState = { status: "idle" };
let manualCodeResolver: ((code: string) => void) | undefined;
let deckService: StudioDeckService | undefined;
let currentArtifactId = createId("artifact");
let sessionsLoaded = false;
let chatSessions: StoredChatSession[] = [];

type StoredChatSession = StudioChatSessionSummary & {
  messages: StudioMessage[];
  manualTitle?: boolean;
};

export function registerStudioIpc(window: BrowserWindow): void {
  mainWindow = window;

  ipcMain.handle("studio:get-auth-status", () => getAuthStatus());
  ipcMain.handle("studio:set-runtime-api-key", (_event, input: StudioSetRuntimeKeyInput) =>
    setRuntimeApiKey(input),
  );
  ipcMain.handle("studio:start-login", (_event, input: StudioStartLoginInput) =>
    startLogin(input),
  );
  ipcMain.handle("studio:disconnect-provider", (_event, input: StudioDisconnectProviderInput) =>
    disconnectProvider(input),
  );
  ipcMain.handle("studio:logout-all", () => logoutAll());
  ipcMain.handle("studio:submit-login-code", (_event, input: StudioSubmitLoginCodeInput) =>
    submitLoginCode(input),
  );
  ipcMain.handle("studio:select-model", (_event, input: StudioSelectModelInput) =>
    selectModel(input),
  );
  ipcMain.handle("studio:get-conversation", () => getConversation());
  ipcMain.handle("studio:list-chat-sessions", () => listChatSessions());
  ipcMain.handle("studio:open-chat-session", (_event, sessionId: string) =>
    openChatSession(sessionId),
  );
  ipcMain.handle("studio:rename-chat-session", (_event, input: StudioRenameChatSessionInput) =>
    renameChatSession(input),
  );
  ipcMain.handle("studio:delete-chat-session", (_event, input: StudioDeleteChatSessionInput) =>
    deleteChatSession(input),
  );
  ipcMain.handle("studio:send-prompt", (_event, input: StudioSendPromptInput) =>
    sendPrompt(input),
  );
  ipcMain.handle("studio:stop", () => stopGeneration());
  ipcMain.handle("studio:new-conversation", () => newConversation());
  ipcMain.handle("studio:open-pi-auth-docs", () => shell.openExternal(PI_AUTH_DOCS_URL));
  ipcMain.handle("studio:open-pi-models-docs", () => shell.openExternal(PI_MODELS_DOCS_URL));
  ipcMain.handle("studio:add-custom-provider", (_event, input: StudioAddCustomProviderInput) =>
    addCustomProvider(input),
  );
  ipcMain.handle("studio:add-custom-model", (_event, input: StudioAddCustomModelInput) =>
    addCustomModel(input),
  );
  ipcMain.handle("studio:remove-custom-model", (_event, input: StudioRemoveCustomModelInput) =>
    removeCustomModel(input),
  );
  ipcMain.handle("studio:list-decks", () => listDecks());
  ipcMain.handle("studio:create-deck", (_event, input?: StudioCreateDeckInput) => createDeck(input));
  ipcMain.handle("studio:get-deck", (_event, deckId: string) => getDeck(deckId));
  ipcMain.handle("studio:open-deck", (_event, deckId: string) => openDeck(deckId));
  ipcMain.handle("studio:reveal-path", (_event, path: string) => revealPath(path));
  ipcMain.handle("studio:export-deck", (_event, input: StudioExportDeckInput) =>
    exportDeck(input),
  );
}

async function getRuntime(): Promise<PiRuntime> {
  runtimePromise ??= createRuntime();
  return runtimePromise;
}

async function createRuntime(): Promise<PiRuntime> {
  process.env.PI_CODING_AGENT_DIR = getPiAgentDir();
  stripPiProviderEnvironment();

  const [{ AuthStorage, ModelRegistry }, { getModel }] = await Promise.all([
    import("@mariozechner/pi-coding-agent") as Promise<PiCodingAgent>,
    import("@mariozechner/pi-ai") as Promise<PiAi>,
  ]);

  const authStorage = AuthStorage.create(join(getPiAgentDir(), "auth.json"));
  const modelRegistry = ModelRegistry.create(authStorage, getModelsJsonPath());
  const availableModels = await Promise.resolve(modelRegistry.getAvailable());
  const selectedModel = availableModels[0] ?? getModel("anthropic", "claude-sonnet-4-6");

  return {
    authStorage,
    modelRegistry: modelRegistry as unknown as PiRuntime["modelRegistry"],
    selectedModel,
    selectedModelId: selectedModel ? getModelKey(selectedModel) : undefined,
  };
}

async function getAuthStatus(): Promise<StudioAuthStatus> {
  const runtime = await getRuntime();
  const availableModels = (await Promise.resolve(runtime.modelRegistry.getAvailable())).map(
    toModelInfo,
  );
  const oauthProviders = getOAuthProviders(runtime);
  if (!runtime.selectedModel && availableModels[0]) {
    const [provider, id] = splitModelId(availableModels[0].id);
    runtime.selectedModel = findModel(runtime, provider, id);
    runtime.selectedModelId = availableModels[0].id;
  }

  const modelsPath = getModelsJsonPath();
  const modelsJsonRead = readModelsJson(modelsPath);
  let customModels: StudioCustomModelRow[] = [];
  let modelsJsonSyntaxError: string | undefined;
  if (modelsJsonRead.ok) {
    customModels = listCustomModelRows(modelsJsonRead.data);
  } else {
    modelsJsonSyntaxError = modelsJsonRead.error;
  }

  const statusPayload: StudioAuthStatus = {
    agentDir: getPiAgentDir(),
    authFile: join(getPiAgentDir(), "auth.json"),
    modelsFile: modelsPath,
    availableModels,
    oauthProviders,
    customModels,
    selectedModelId: runtime.selectedModelId,
    hasAvailableModels: availableModels.length > 0,
    login: loginState,
    modelsJsonSyntaxError,
    modelsRegistryError: runtime.modelRegistry.getError?.(),
    setupHint:
      availableModels.length > 0
        ? undefined
        : "No Pi models are authenticated yet for Studio. Add a BYOK runtime key here or sign in from this app.",
  };

  emit({ type: "auth", payload: statusPayload });
  return statusPayload;
}

async function startLogin(input: StudioStartLoginInput): Promise<StudioAuthStatus> {
  const runtime = await getRuntime();
  const provider = getOAuthProviders(runtime).find((candidate) => candidate.id === input.providerId);
  if (!provider) {
    throw new Error(`Pi OAuth provider not found: ${input.providerId}`);
  }
  if (loginState.status === "starting" || loginState.status === "waiting") {
    throw new Error("A Pi login flow is already running.");
  }

  loginState = {
    status: "starting",
    providerId: provider.id,
    providerName: provider.name,
    progress: [`Starting ${provider.name} login...`],
  };
  emitAuth();

  runtime.authStorage
    .login(provider.id, {
      onAuth: (info) => {
        loginState = {
          ...loginState,
          status: "waiting",
          authUrl: info.url,
          instructions: info.instructions,
          progress: [...(loginState.progress ?? []), "Opened browser for provider login."],
        };
        shell.openExternal(info.url).catch(() => undefined);
        emitAuth();
      },
      onPrompt: async (prompt) => {
        loginState = {
          ...loginState,
          status: "waiting",
          needsManualCode: true,
          promptMessage: prompt.message,
          progress: [...(loginState.progress ?? []), prompt.message],
        };
        emitAuth();
        return waitForManualCode();
      },
      onManualCodeInput: async () => {
        loginState = {
          ...loginState,
          status: "waiting",
          needsManualCode: true,
          promptMessage: "Paste the redirect URL or authorization code from the provider.",
        };
        emitAuth();
        return waitForManualCode();
      },
      onProgress: (message) => {
        loginState = {
          ...loginState,
          progress: [...(loginState.progress ?? []), message],
        };
        emitAuth();
      },
    })
    .then(async () => {
      runtime.modelRegistry.refresh?.();
      const nextAuth = await getAuthStatus();
      loginState = {
        status: "completed",
        providerId: provider.id,
        providerName: provider.name,
        progress: [...(loginState.progress ?? []), "Login completed."],
      };
      emit({ type: "auth", payload: { ...nextAuth, login: loginState } });
    })
    .catch(async (error: unknown) => {
      loginState = {
        ...loginState,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
      emitAuth();
    })
    .finally(() => {
      manualCodeResolver = undefined;
    });

  return getAuthStatus();
}

async function submitLoginCode(input: StudioSubmitLoginCodeInput): Promise<StudioAuthStatus> {
  const code = input.code.trim();
  if (!code) {
    throw new Error("Login code is required.");
  }
  if (!manualCodeResolver) {
    throw new Error("No Pi login flow is waiting for a manual code.");
  }
  manualCodeResolver(code);
  manualCodeResolver = undefined;
  loginState = {
    ...loginState,
    needsManualCode: false,
    progress: [...(loginState.progress ?? []), "Submitted manual login code."],
  };
  return getAuthStatus();
}

async function setRuntimeApiKey(input: StudioSetRuntimeKeyInput): Promise<StudioAuthStatus> {
  const provider = input.provider.trim();
  const apiKey = input.apiKey.trim();
  if (!provider || !apiKey) {
    throw new Error("Provider and API key are required.");
  }

  const runtime = await getRuntime();
  runtime.authStorage.setRuntimeApiKey(provider, apiKey);
  return getAuthStatus();
}

async function addCustomProvider(input: StudioAddCustomProviderInput): Promise<StudioAuthStatus> {
  const path = getModelsJsonPath();
  const read = readModelsJson(path);
  if (!read.ok) {
    throw new Error(read.error);
  }
  const next = addCustomProviderEntry(read.data, input);
  writeModelsJson(path, next);

  const runtime = await getRuntime();
  runtime.modelRegistry.refresh?.();
  return getAuthStatus();
}

async function addCustomModel(input: StudioAddCustomModelInput): Promise<StudioAuthStatus> {
  const path = getModelsJsonPath();
  const read = readModelsJson(path);
  if (!read.ok) {
    throw new Error(read.error);
  }
  const next = addCustomModelEntry(read.data, input);
  writeModelsJson(path, next);

  const runtime = await getRuntime();
  runtime.modelRegistry.refresh?.();
  return getAuthStatus();
}

async function removeCustomModel(input: StudioRemoveCustomModelInput): Promise<StudioAuthStatus> {
  const path = getModelsJsonPath();
  const read = readModelsJson(path);
  if (!read.ok) {
    throw new Error(read.error);
  }
  const next = removeCustomModelEntry(read.data, input);
  writeModelsJson(path, next);

  const runtime = await getRuntime();
  runtime.modelRegistry.refresh?.();
  await resyncSelectedModelAfterRegistryChange(runtime);
  return getAuthStatus();
}

async function disconnectProvider(input: StudioDisconnectProviderInput): Promise<StudioAuthStatus> {
  const providerId = input.providerId.trim();
  if (!providerId) {
    throw new Error("Provider id is required.");
  }

  const runtime = await getRuntime();
  runtime.authStorage.logout(providerId);
  runtime.authStorage.removeRuntimeApiKey(providerId);
  runtime.modelRegistry.refresh?.();
  await resyncSelectedModelAfterRegistryChange(runtime);
  return getAuthStatus();
}

async function logoutAll(): Promise<StudioAuthStatus> {
  const runtime = await getRuntime();
  const providers = getOAuthProviders(runtime);
  for (const provider of providers) {
    try {
      runtime.authStorage.logout(provider.id);
    } catch {
      // ignore per-provider failures so one bad provider doesn't block sign out
    }
    try {
      runtime.authStorage.removeRuntimeApiKey(provider.id);
    } catch {
      // ignore
    }
  }
  // Also clear any runtime keys for BYOK providers that aren't in the OAuth list
  for (const extra of ["openai", "anthropic", "google", "groq", "openrouter", "xai", "deepseek", "mistral", "cerebras", "fireworks"]) {
    try {
      runtime.authStorage.removeRuntimeApiKey(extra);
    } catch {
      // ignore
    }
  }
  await disposeRuntimeSession(runtime);
  runtime.modelRegistry.refresh?.();
  await resyncSelectedModelAfterRegistryChange(runtime);
  loginState = { status: "idle" };
  return getAuthStatus();
}

async function selectModel(input: StudioSelectModelInput): Promise<StudioAuthStatus> {
  const runtime = await getRuntime();
  const [provider, id] = splitModelId(input.modelId);
  const model = findModel(runtime, provider, id);
  if (!model) {
    throw new Error(`Pi model not found: ${input.modelId}`);
  }

  runtime.selectedModel = model;
  runtime.selectedModelId = input.modelId;
  if (runtime.session?.setModel) {
    await runtime.session.setModel(model);
  }

  return getAuthStatus();
}

async function sendPrompt(input: StudioSendPromptInput): Promise<StudioConversationSnapshot> {
  const content = input.content.trim();
  if (!content) return getConversationSnapshot();
  await ensureChatSessionsLoaded();

  const runtime = await getRuntime();
  if (input.modelId) {
    await selectModel({ modelId: input.modelId });
  }

  const userMessage: StudioMessage = {
    id: createId("user"),
    role: "user",
    content,
    parts: [{ type: "text", text: content }],
    createdAt: Date.now(),
    status: "done",
  };
  const assistantMessage: StudioMessage = {
    id: createId("assistant"),
    role: "assistant",
    content: "",
    createdAt: Date.now(),
    status: "streaming",
  };
  messages = [...messages, userMessage, assistantMessage];
  await saveCurrentChatSession();
  status = "submitted";
  lastError = undefined;
  emitConversation();

  const session = await ensureSession(runtime);
  status = "streaming";
  emitConversation();

  session
    .prompt(content)
    .then(async () => {
      finishAssistantMessage("done");
      status = "ready";
      emitConversation();
      await saveCurrentChatSession();
      await emitSessions();
      void emitDecks();
      void maybeGenerateSessionTitle(currentSessionId);
    })
    .catch((error: unknown) => {
      finishAssistantMessage("error");
      status = "error";
      lastError = error instanceof Error ? error.message : String(error);
      appendAssistantText(`\n\n${lastError}`);
      emitConversation();
      void saveCurrentChatSession();
      void emitSessions();
    });

  return getConversationSnapshot();
}

async function stopGeneration(): Promise<StudioConversationSnapshot> {
  const runtime = await getRuntime();
  if (runtime.session) {
    await runtime.session.abort();
  }
  finishAssistantMessage("done");
  status = "ready";
  emitConversation();
  await saveCurrentChatSession();
  await emitSessions();
  return getConversationSnapshot();
}

async function getConversation(): Promise<StudioConversationSnapshot> {
  await ensureChatSessionsLoaded();
  return getConversationSnapshot();
}

async function newConversation(): Promise<StudioConversationSnapshot> {
  await ensureChatSessionsLoaded();
  await saveCurrentChatSession();
  const runtime = await getRuntime();
  await disposeRuntimeSession(runtime);
  messages = [];
  status = "ready";
  lastError = undefined;
  currentSessionId = createId("session");
  currentArtifactId = createId("artifact");
  await getDeckService().ensureArtifactWorkspace(currentArtifactId);
  emitConversation();
  await emitSessions();
  await emitDecks();
  return getConversationSnapshot();
}

async function listChatSessions(): Promise<StudioChatSessionSummary[]> {
  await ensureChatSessionsLoaded();
  await saveCurrentChatSession();
  return chatSessions.map(({ messages: _messages, ...summary }) => summary);
}

async function openChatSession(sessionId: string): Promise<StudioConversationSnapshot> {
  await ensureChatSessionsLoaded();
  await saveCurrentChatSession();
  const runtime = await getRuntime();
  await disposeRuntimeSession(runtime);
  const session = chatSessions.find((candidate) => candidate.id === sessionId);
  if (!session) throw new Error("Chat session not found.");
  currentSessionId = session.id;
  currentArtifactId = session.artifactId;
  messages = session.messages;
  status = "ready";
  lastError = undefined;
  emitConversation();
  await emitSessions();
  await emitDecks();
  return getConversationSnapshot();
}

async function renameChatSession(
  input: StudioRenameChatSessionInput,
): Promise<StudioChatSessionSummary[]> {
  await ensureChatSessionsLoaded();
  const title = input.title.trim().slice(0, 64);
  if (!title) throw new Error("Chat title is required.");
  const target = chatSessions.find((session) => session.id === input.sessionId);
  if (!target) throw new Error("Chat session not found.");
  target.title = title;
  target.manualTitle = true;
  target.updatedAt = Date.now();
  await persistChatSessions();
  await emitSessions();
  return chatSessions.map(({ messages: _messages, ...summary }) => summary);
}

async function deleteChatSession(
  input: StudioDeleteChatSessionInput,
): Promise<StudioConversationSnapshot> {
  await ensureChatSessionsLoaded();
  chatSessions = chatSessions.filter((session) => session.id !== input.sessionId);
  await persistChatSessions();

  if (input.sessionId === currentSessionId) {
    const runtime = await getRuntime();
    await disposeRuntimeSession(runtime);
    messages = [];
    status = "ready";
    lastError = undefined;
    currentSessionId = createId("session");
    currentArtifactId = createId("artifact");
    await getDeckService().ensureArtifactWorkspace(currentArtifactId);
    emitConversation();
  }

  await emitSessions();
  await emitDecks();
  return getConversationSnapshot();
}

async function listDecks(): Promise<StudioDeckProject[]> {
  const deck = await getDeckService().readArtifactDeck(currentArtifactId);
  return deck ? [deck] : [];
}

async function createDeck(input?: StudioCreateDeckInput): Promise<StudioDeckProject> {
  const deck = await getDeckService().createDeck(input);
  await emitDecks();
  return deck;
}

async function getDeck(deckId: string): Promise<StudioDeckProject> {
  return (await getDeckService().readArtifactDeck(deckId)) ?? getDeckService().readDeck(deckId);
}

async function openDeck(deckId: string): Promise<void> {
  await getDeckService().openDeck(deckId);
}

async function revealPath(path: string): Promise<void> {
  shell.showItemInFolder(path);
}

async function exportDeck(input: StudioExportDeckInput): Promise<StudioExportDeckResult> {
  return getDeckService().exportDeck(input, mainWindow);
}

async function ensureSession(runtime: PiRuntime): Promise<PiSession> {
  if (runtime.session) return runtime.session;

  const { createAgentSession, DefaultResourceLoader, SessionManager, SettingsManager } =
    await import("@mariozechner/pi-coding-agent");
  const cwd = await getDeckService().ensureArtifactWorkspace(currentArtifactId);
  // Append Studio guidance instead of overriding Pi's base system prompt: the
  // base prompt is what tells the model the available tools and how to call
  // them. Replacing it caused the model to invent <tool_call>...</tool_call>
  // text instead of emitting structured Pi tool calls.
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir: getPiAgentDir(),
    settingsManager: SettingsManager.inMemory(),
    noContextFiles: true,
    noExtensions: true,
    noPromptTemplates: true,
    noSkills: true,
    noThemes: true,
    appendSystemPrompt: [STUDIO_SYSTEM_PROMPT],
    agentsFilesOverride: () => ({ agentsFiles: [] }),
    extensionsOverride: (base) => ({ ...base, extensions: [], errors: [] }),
    promptsOverride: () => ({ prompts: [], diagnostics: [] }),
    skillsOverride: () => ({ skills: [], diagnostics: [] }),
    themesOverride: () => ({ themes: [], diagnostics: [] }),
  });
  await resourceLoader.reload();

  // Don't pass `tools` (string[] allowlist) or hand-built customTools — Pi's
  // default coding tools (read, bash, edit, write, grep, find, ls) are
  // registered automatically when both fields are omitted.
  const { session } = await createAgentSession({
    cwd,
    model: runtime.selectedModel as never,
    authStorage: runtime.authStorage as never,
    modelRegistry: runtime.modelRegistry as never,
    resourceLoader,
    settingsManager: SettingsManager.inMemory(),
    sessionManager: SessionManager.inMemory(),
  });

  runtime.session = session as PiSession;
  runtime.unsubscribe = runtime.session.subscribe(handlePiEvent);
  return runtime.session;
}

async function disposeRuntimeSession(runtime: PiRuntime): Promise<void> {
  if (!runtime.session) return;
  try {
    await runtime.session.abort();
  } catch {
    // ignore abort errors when no generation is in flight
  }
  runtime.unsubscribe?.();
  runtime.session.dispose();
  runtime.session = undefined;
  runtime.unsubscribe = undefined;
}

function handlePiEvent(event: PiSessionEvent): void {
  if (event.type === "tool_execution_start") {
    upsertAssistantToolPart(event.toolCallId, event.toolName, event.args, undefined, false);
    emitConversation();
    return;
  }

  if (event.type === "tool_execution_update") {
    upsertAssistantToolPart(
      event.toolCallId,
      event.toolName,
      event.args,
      event.partialResult,
      false,
      "input-available",
    );
    emitConversation();
    return;
  }

  if (event.type === "tool_execution_end") {
    upsertAssistantToolPart(
      event.toolCallId,
      event.toolName,
      undefined,
      event.result,
      Boolean(event.isError),
    );
    emitConversation();
    if (!event.isError && isArtifactFileTool(event.toolName)) {
      void emitDecks();
    }
    return;
  }

  if (event.type === "message_end" && event.message) {
    syncAssistantMessageFromPi(event.message);
    emitConversation();
    return;
  }

  if (event.type !== "message_update") return;

  const assistantEvent = event.assistantMessageEvent;
  if (!assistantEvent) return;

  if (assistantEvent.type === "text_delta" && assistantEvent.delta) {
    appendAssistantText(assistantEvent.delta);
    emitConversation();
  }

  if (assistantEvent.type === "text_end" && typeof assistantEvent.content === "string") {
    finalizeStreamingTextPart(assistantEvent.content);
    emitConversation();
  }

  if (assistantEvent.type === "toolcall_end" && assistantEvent.toolCall) {
    upsertAssistantToolCall(assistantEvent.toolCall);
    emitConversation();
  }
}

function getConversationSnapshot(): StudioConversationSnapshot {
  return {
    id: currentSessionId,
    status,
    messages,
    selectedModelId: undefined,
    currentArtifactId,
    error: lastError,
  };
}

function appendAssistantText(delta: string): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    const parts = appendDeltaToLastTextPart(message.parts, delta);
    const content = computeContentFromParts(parts);
    return { ...message, content, parts };
  });
}

/** On text_end, replace the trailing in-flight text part with the final text. */
function finalizeStreamingTextPart(finalText: string): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    const parts = replaceLastTextPart(message.parts, finalText);
    const content = computeContentFromParts(parts);
    return { ...message, content, parts };
  });
}

/** On message_end, rebuild parts from Pi's authoritative content array. */
function syncAssistantMessageFromPi(piMessage: unknown): void {
  const record = asRecord(piMessage);
  if (!record || record["role"] !== "assistant" || !Array.isArray(record["content"])) return;

  const piParts = record["content"].flatMap(toStudioPart);
  if (piParts.length === 0) return;

  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    const parts = mergePiPartsWithExisting(piParts, message.parts);
    const content = computeContentFromParts(parts);
    return { ...message, content, parts };
  });
}

function toStudioPart(content: unknown): StudioMessagePart[] {
  const record = asRecord(content);
  if (!record) return [];
  if (record["type"] === "text" && typeof record["text"] === "string") {
    return [{ type: "text", text: record["text"] }];
  }
  if (record["type"] === "thinking" && typeof record["thinking"] === "string") {
    return [
      {
        type: "tool-Thinking",
        toolCallId: `thinking-${hashString(record["thinking"])}`,
        state: "output-available",
        input: {},
        output: record["thinking"],
      },
    ];
  }
  if (record["type"] === "toolCall") {
    const part = toolCallToPart(record);
    return part ? [part] : [];
  }
  return [];
}

function upsertAssistantToolCall(toolCall: unknown): void {
  const record = asRecord(toolCall);
  const part = record ? toolCallToPart(record) : undefined;
  if (!part) return;
  upsertAssistantPart(part);
}

function upsertAssistantToolPart(
  toolCallId: unknown,
  toolName: unknown,
  args: unknown,
  output: unknown,
  isError: boolean,
  pendingState: NonNullable<StudioMessagePart["state"]> = "input-available",
): void {
  if (typeof toolCallId !== "string" || typeof toolName !== "string") return;
  upsertAssistantPart({
    type: `tool-${toAgentElementsToolName(toolName)}`,
    toolCallId,
    state: output === undefined ? pendingState : isError ? "output-error" : "output-available",
    input: args,
    output,
    result: output,
  });
}

function upsertAssistantPart(part: StudioMessagePart): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    return { ...message, parts: upsertPart(message.parts, part) };
  });
}

function toolCallToPart(toolCall: Record<string, unknown>): StudioMessagePart | undefined {
  const id = toolCall["id"];
  const name = toolCall["name"];
  if (typeof id !== "string" || typeof name !== "string") return undefined;
  return {
    type: `tool-${toAgentElementsToolName(name)}`,
    toolCallId: id,
    state: "input-available",
    input: toolCall["arguments"] ?? {},
  };
}

/**
 * Append a streamed text delta. If the last part is a text part it is grown
 * in place, otherwise a new text part is pushed. This preserves chronological
 * ordering so the UI can render text → tool → text → tool sequences.
 */
function appendDeltaToLastTextPart(
  parts: StudioMessagePart[] | undefined,
  delta: string,
): StudioMessagePart[] {
  const list = parts ?? [];
  const last = list[list.length - 1];
  if (last && last.type === "text") {
    return [
      ...list.slice(0, -1),
      { ...last, text: `${last.text ?? ""}${delta}` },
    ];
  }
  return [...list, { type: "text", text: delta }];
}

function replaceLastTextPart(
  parts: StudioMessagePart[] | undefined,
  text: string,
): StudioMessagePart[] {
  const list = parts ?? [];
  const last = list[list.length - 1];
  if (last && last.type === "text") {
    return [...list.slice(0, -1), { ...last, text }];
  }
  return [...list, { type: "text", text }];
}

function computeContentFromParts(parts: StudioMessagePart[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

function upsertPart(parts: StudioMessagePart[] | undefined, part: StudioMessagePart): StudioMessagePart[] {
  if (!part.toolCallId) return [...(parts ?? []), part];
  const existing = parts ?? [];
  const index = existing.findIndex((candidate) => candidate.toolCallId === part.toolCallId);
  if (index === -1) return [...existing, part];
  return existing.map((candidate, candidateIndex) =>
    candidateIndex === index
      ? {
          ...candidate,
          ...part,
          input: part.input ?? candidate.input,
          output: part.output ?? candidate.output,
          result: part.result ?? candidate.result,
        }
      : candidate,
  );
}

/**
 * Reconcile Pi's authoritative parts (text + toolCall, in order) with the
 * existing list, preserving any tool execution state (output/result) that
 * arrived through the tool_execution_* events.
 */
function mergePiPartsWithExisting(
  piParts: StudioMessagePart[],
  existingParts: StudioMessagePart[] | undefined,
): StudioMessagePart[] {
  const existing = existingParts ?? [];
  const merged = piParts.map((piPart) => {
    if (!piPart.toolCallId) return piPart;
    const match = existing.find((candidate) => candidate.toolCallId === piPart.toolCallId);
    if (!match) return piPart;
    return {
      ...piPart,
      state: match.state ?? piPart.state,
      input: piPart.input ?? match.input,
      output: match.output ?? piPart.output,
      result: match.result ?? piPart.result,
    };
  });
  const mergedIds = new Set(
    merged
      .map((part) => part.toolCallId)
      .filter((toolCallId): toolCallId is string => typeof toolCallId === "string"),
  );
  const missingToolParts = existing.filter(
    (part) => part.toolCallId && part.type.startsWith("tool-") && !mergedIds.has(part.toolCallId),
  );
  return [...merged, ...missingToolParts];
}

function toAgentElementsToolName(toolName: string): string {
  const aliases: Record<string, string> = {
    bash: "Bash",
    read: "Read",
    edit: "Edit",
    write: "Write",
    grep: "Grep",
    find: "Glob",
    ls: "Glob",
  };
  return aliases[toolName] ?? toolName.replace(/(^|[-_])(\w)/g, (_match, _sep, char: string) =>
    char.toUpperCase(),
  );
}

function isArtifactFileTool(toolName: unknown): boolean {
  return toolName === "write" || toolName === "edit" || toolName === "bash";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function finishAssistantMessage(nextStatus: NonNullable<StudioMessage["status"]>): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    return { ...message, status: nextStatus };
  });
}

function emitConversation(): void {
  emit({ type: "conversation", payload: getConversationSnapshot() });
}

async function emitDecks(): Promise<void> {
  emit({ type: "decks", payload: await listDecks() });
}

async function emitSessions(): Promise<void> {
  emit({ type: "sessions", payload: await listChatSessions() });
}

async function emitAuth(): Promise<void> {
  emit({ type: "auth", payload: await getAuthStatus() });
}

function emit(event: StudioEvent): void {
  mainWindow?.webContents.send("studio:event", event);
}

function findModel(runtime: PiRuntime, provider: string, id: string): unknown {
  return runtime.modelRegistry.find?.(provider, id);
}

function toModelInfo(model: unknown): StudioModelInfo {
  const record = model as Record<string, unknown>;
  const provider = String(record["provider"] ?? "unknown");
  const id = String(record["id"] ?? "unknown");
  const name = String(record["name"] ?? id);
  return {
    id: `${provider}/${id}`,
    provider,
    name,
    label: `${provider}/${name}`,
    contextWindow: typeof record["contextWindow"] === "number" ? record["contextWindow"] : undefined,
    maxTokens: typeof record["maxTokens"] === "number" ? record["maxTokens"] : undefined,
  };
}

function getOAuthProviders(runtime: PiRuntime): StudioOAuthProviderInfo[] {
  const authStorage = runtime.authStorage as {
    getOAuthProviders?: () => Array<{ id: string; name: string }>;
  };
  return (
    authStorage.getOAuthProviders?.().map((provider) => ({
      id: provider.id,
      name: provider.name,
    })) ?? []
  );
}

function waitForManualCode(): Promise<string> {
  return new Promise((resolve) => {
    manualCodeResolver = resolve;
  });
}

function getModelKey(model: unknown): string | undefined {
  const record = model as Record<string, unknown>;
  const provider = record["provider"];
  const id = record["id"];
  if (typeof provider !== "string" || typeof id !== "string") return undefined;
  return `${provider}/${id}`;
}

function splitModelId(modelId: string): [provider: string, id: string] {
  const [provider, ...rest] = modelId.split("/");
  if (!provider || rest.length === 0) {
    throw new Error(`Invalid model id: ${modelId}`);
  }
  return [provider, rest.join("/")];
}

/** Studio-specific Pi agent config dir. Do not read the user's global `~/.pi/agent` config. */
function getPiAgentDir(): string {
  return join(app.getPath("userData"), "pi-agent");
}

function stripPiProviderEnvironment(): void {
  for (const key of PI_PROVIDER_ENV_KEYS) {
    delete process.env[key];
  }
}

function getModelsJsonPath(): string {
  return join(getPiAgentDir(), "models.json");
}

function getDeckService(): StudioDeckService {
  deckService ??= new StudioDeckService(join(app.getPath("userData"), "artifacts"));
  return deckService;
}

async function ensureChatSessionsLoaded(): Promise<void> {
  if (sessionsLoaded) return;
  sessionsLoaded = true;
  try {
    const raw = await readFile(getChatSessionsPath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    chatSessions = Array.isArray(parsed)
      ? parsed.filter(isStoredChatSession).sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  } catch {
    chatSessions = [];
  }
}

async function saveCurrentChatSession(): Promise<void> {
  await ensureChatSessionsLoaded();
  if (messages.length === 0) return;
  const now = Date.now();
  const existing = chatSessions.find((session) => session.id === currentSessionId);
  const session: StoredChatSession = {
    id: currentSessionId,
    title: existing?.manualTitle ? existing.title : getSessionTitle(messages),
    artifactId: currentArtifactId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages,
    manualTitle: existing?.manualTitle,
  };
  chatSessions = [
    session,
    ...chatSessions.filter((candidate) => candidate.id !== currentSessionId),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
  await persistChatSessions();
}

async function persistChatSessions(): Promise<void> {
  await mkdir(getPiAgentDir(), { recursive: true });
  await writeFile(getChatSessionsPath(), JSON.stringify(chatSessions, null, 2), "utf8");
}

function getChatSessionsPath(): string {
  return join(getPiAgentDir(), "chat-sessions.json");
}

async function maybeGenerateSessionTitle(sessionId: string): Promise<void> {
  const session = chatSessions.find((candidate) => candidate.id === sessionId);
  if (!session || session.manualTitle) return;

  const userText = session.messages
    .find((message) => message.role === "user")
    ?.content.trim();
  const assistantText = session.messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content)
    .join("\n")
    .trim();
  if (!userText || !assistantText) return;

  const runtime = await getRuntime();
  if (!runtime.selectedModel) return;

  try {
    const { completeSimple } = await import("@mariozechner/pi-ai");
    const result = await completeSimple(runtime.selectedModel as never, {
      systemPrompt:
        "You name chat conversations. Reply with a concise 3-6 word title in Title Case. No quotes, no punctuation, no trailing period. Capture the core task or topic.",
      messages: [
        {
          role: "user",
          content: `User message:\n${truncate(userText, 600)}\n\nAssistant reply:\n${truncate(
            assistantText,
            600,
          )}\n\nReturn only the title.`,
          timestamp: Date.now(),
        },
      ],
    });

    const title = extractTitleFromAssistantMessage(result);
    if (!title) return;

    const stored = chatSessions.find((candidate) => candidate.id === sessionId);
    if (!stored || stored.manualTitle) return;
    stored.title = title;
    await persistChatSessions();
    await emitSessions();
  } catch {
    // Title generation is best-effort; keep the heuristic title on failure.
  }
}

function extractTitleFromAssistantMessage(message: unknown): string | undefined {
  const record = asRecord(message);
  const content = record?.["content"];
  if (!Array.isArray(content)) return undefined;
  const text = content
    .map((part) => {
      const partRecord = asRecord(part);
      return partRecord?.["type"] === "text" && typeof partRecord["text"] === "string"
        ? (partRecord["text"] as string)
        : "";
    })
    .join(" ")
    .trim();
  if (!text) return undefined;
  const cleaned = text
    .split("\n")[0]!
    .replace(/^["'`*_\s]+|["'`*_\s.]+$/g, "")
    .trim();
  if (!cleaned) return undefined;
  return cleaned.length > 64 ? `${cleaned.slice(0, 61).trimEnd()}…` : cleaned;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function getSessionTitle(sessionMessages: StudioMessage[]): string {
  const firstUser = sessionMessages.find((message) => message.role === "user");
  const raw = firstUser?.content.trim().replace(/\s+/g, " ");
  if (!raw) return "Untitled chat";

  // Strip common conversational fillers so the title focuses on the topic.
  const stripped = raw
    .replace(
      /^(please|hey|hi|hello|ok|okay|so|um|now|alright)[, ]+/i,
      "",
    )
    .replace(
      /^(can|could|would|will)\s+(you|we)\s+(please\s+)?/i,
      "",
    )
    .replace(/^(i\s+)?(want|need|would like|'?d like|wanna)\s+(to\s+)?/i, "")
    .replace(/^(let'?s|let us|help me|help us)\s+/i, "")
    .replace(/^(make|build|create|design|draft|write|generate)\s+(me\s+|us\s+)?/i, "Make ");

  // Use the first sentence/clause for a concise label.
  const firstClause = stripped.split(/[.!?\n]/)[0]?.trim() ?? stripped;
  const compact = firstClause.split(/[,;:—–-]/)[0]?.trim() || firstClause;
  const capitalized = compact.charAt(0).toUpperCase() + compact.slice(1);

  if (capitalized.length <= 48) return capitalized || "Untitled chat";
  const words = capitalized.split(" ");
  let title = "";
  for (const word of words) {
    if ((title + (title ? " " : "") + word).length > 45) break;
    title = title ? `${title} ${word}` : word;
  }
  return `${title}…`;
}

function isStoredChatSession(value: unknown): value is StoredChatSession {
  const record = asRecord(value);
  return Boolean(
    record &&
      typeof record["id"] === "string" &&
      typeof record["title"] === "string" &&
      typeof record["artifactId"] === "string" &&
      typeof record["createdAt"] === "number" &&
      typeof record["updatedAt"] === "number" &&
      Array.isArray(record["messages"]),
  );
}

async function resyncSelectedModelAfterRegistryChange(runtime: PiRuntime): Promise<void> {
  const availableModels = (await Promise.resolve(runtime.modelRegistry.getAvailable())).map(
    toModelInfo,
  );
  const selectedStillValid =
    Boolean(runtime.selectedModelId) &&
    availableModels.some((model) => model.id === runtime.selectedModelId);
  if (selectedStillValid) return;

  if (availableModels[0]) {
    const [provider, id] = splitModelId(availableModels[0].id);
    runtime.selectedModel = findModel(runtime, provider, id);
    runtime.selectedModelId = availableModels[0].id;
  } else {
    runtime.selectedModel = undefined;
    runtime.selectedModelId = undefined;
  }

  if (runtime.session?.setModel && runtime.selectedModel) {
    await runtime.session.setModel(runtime.selectedModel);
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
