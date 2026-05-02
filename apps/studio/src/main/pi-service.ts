import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";

import type {
  StudioAddCustomModelInput,
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioCreateDeckInput,
  StudioConversationSnapshot,
  StudioCustomModelRow,
  StudioDeckProject,
  StudioEvent,
  StudioExportDeckInput,
  StudioExportDeckResult,
  StudioLoginState,
  StudioMessage,
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
import { getCursorApiKey } from "./cursor-service";
import { isCursorModelId } from "../shared/cursor-model-id";
import {
  cancelCursorRun,
  disposeCursorAgent,
  runCursorPrompt,
} from "./cursor-runtime";

import { StudioChatController } from "./studio-chat-controller";
import {
  PI_AUTH_DOCS_URL,
  PI_MODELS_DOCS_URL,
  STUDIO_SYSTEM_PROMPT,
} from "./pi/constants";
import { createId } from "./pi/id-utils";
import {
  findModel,
  getModelKey,
  getOAuthProviders,
  modelRegistryAsRuntime,
  splitModelId,
  toModelInfo,
} from "./pi/model-format";
import {
  getModelsJsonPath,
  getPiAgentDir,
  stripPiProviderEnvironment,
} from "./pi/paths";
import type { PiAi, PiCodingAgent, PiRuntime, PiSession } from "./pi/types";

let mainWindow: BrowserWindow | undefined;
let runtimePromise: Promise<PiRuntime> | undefined;
let loginState: StudioLoginState = { status: "idle" };
let manualCodeResolver: ((code: string) => void) | undefined;
let deckService: StudioDeckService | undefined;
/** Conversation state, Pi streaming, session persistence. */
let chat: StudioChatController;

export function registerStudioIpc(window: BrowserWindow): void {
  mainWindow = window;

  chat = new StudioChatController({
    emit: (event) => mainWindow?.webContents.send("studio:event", event),
    getDeckService,
  });

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
  ipcMain.handle("studio:list-chat-sessions", () => chat.listChatSessionSummaries());
  ipcMain.handle("studio:open-chat-session", (_event, sessionId: string) =>
    openChatSession(sessionId),
  );
  ipcMain.handle("studio:rename-chat-session", (_event, input: StudioRenameChatSessionInput) =>
    chat.renameChatSession(input),
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
  ipcMain.handle("studio:list-decks", () => chat.listDecksForCurrentArtifact());
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
  const modelRegistry = modelRegistryAsRuntime(
    ModelRegistry.create(authStorage, getModelsJsonPath()),
  );
  const runtime: PiRuntime = {
    authStorage,
    modelRegistry,
  };
  await refreshModelRegistry(runtime);
  const availableModels = await Promise.resolve(modelRegistry.getAvailable());
  const selectedModel = availableModels[0] ?? getModel("anthropic", "claude-sonnet-4-6");

  return {
    ...runtime,
    selectedModel,
    selectedModelId: selectedModel ? getModelKey(selectedModel) : undefined,
  };
}

async function refreshModelRegistry(runtime: PiRuntime): Promise<void> {
  await Promise.resolve(runtime.modelRegistry.refresh?.());
  runtime.modelRegistryRefreshed = true;
}

async function getAuthStatus(): Promise<StudioAuthStatus> {
  const runtime = await getRuntime();
  if (!runtime.modelRegistryRefreshed) {
    await refreshModelRegistry(runtime);
  }
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
      await refreshModelRegistry(runtime);
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
  await refreshModelRegistry(runtime);
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
  await refreshModelRegistry(runtime);
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
  await refreshModelRegistry(runtime);
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
  await refreshModelRegistry(runtime);
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
  await refreshModelRegistry(runtime);
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
  if (!content) return chat.getConversationSnapshot();
  await chat.ensureChatSessionsLoaded();

  const isCursorModel = isCursorModelId(input.modelId);

  if (isCursorModel && input.modelId) {
    return startCursorPrompt(content, input.modelId);
  }

  const runtime = await getRuntime();
  if (input.modelId && !isCursorModel) {
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
  chat.messages = [...chat.messages, userMessage, assistantMessage];
  chat.clearAssistantStreamState();
  await chat.saveCurrentChatSession();
  chat.status = "submitted";
  chat.lastError = undefined;
  chat.emitConversation();

  const session = await ensureSession(runtime);
  chat.status = "streaming";
  chat.emitConversation();

  session
    .prompt(content)
    .then(async () => {
      chat.finishAssistantMessage("done");
      chat.status = "ready";
      chat.emitConversation();
      await chat.saveCurrentChatSession();
      await emitSessions();
      void emitDecks();
      void chat.maybeGenerateSessionTitle(chat.currentSessionId, getRuntime);
    })
    .catch((error: unknown) => {
      chat.finishAssistantMessage("error");
      chat.status = "error";
      chat.lastError = error instanceof Error ? error.message : String(error);
      chat.appendStreamingText(undefined, `\n\n${chat.lastError}`);
      chat.emitConversation();
      void chat.saveCurrentChatSession();
      void emitSessions();
    });

  return chat.getConversationSnapshot();
}

async function startCursorPrompt(
  content: string,
  modelId: string,
): Promise<StudioConversationSnapshot> {
  const apiKey = getCursorApiKey();
  if (!apiKey) {
    throw new Error(
      "Sign in to Cursor first — no API key is currently stored for this device.",
    );
  }

  const cwd = await getDeckService().ensureArtifactWorkspace(chat.currentArtifactId);
  const sessionId = chat.currentSessionId;

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
  chat.messages = [...chat.messages, userMessage, assistantMessage];
  chat.clearAssistantStreamState();
  await chat.saveCurrentChatSession();
  chat.status = "submitted";
  chat.lastError = undefined;
  chat.emitConversation();

  chat.status = "streaming";
  chat.emitConversation();

  void runCursorPrompt({
    sessionId,
    modelId,
    cwd,
    apiKey,
    prompt: content,
    callbacks: {
      onTextDelta(delta) {
        if (!delta) return;
        chat.appendStreamingText(undefined, delta);
        chat.emitConversation();
      },
      onThinkingDelta(delta) {
        if (!delta) return;
        chat.appendStreamingThinking(undefined, delta);
        chat.emitConversation();
      },
      onFinish() {
        if (sessionId !== chat.currentSessionId) return;
        chat.finalizeStreamingThinking(undefined);
        chat.finishAssistantMessage("done");
        chat.status = "ready";
        chat.emitConversation();
        void chat.saveCurrentChatSession().then(() => {
          void emitSessions();
          void emitDecks();
          void chat.maybeGenerateSessionTitle(chat.currentSessionId, getRuntime);
        });
      },
      onError(message) {
        if (sessionId !== chat.currentSessionId) return;
        chat.finalizeStreamingThinking(undefined);
        chat.appendStreamingText(undefined, `\n\n${message}`);
        chat.finishAssistantMessage("error");
        chat.status = "error";
        chat.lastError = message;
        chat.emitConversation();
        void chat.saveCurrentChatSession();
        void emitSessions();
      },
      onCancel() {
        if (sessionId !== chat.currentSessionId) return;
        chat.finalizeStreamingThinking(undefined);
        chat.finishAssistantMessage("done");
        chat.status = "ready";
        chat.emitConversation();
        void chat.saveCurrentChatSession();
        void emitSessions();
      },
    },
  });

  return chat.getConversationSnapshot();
}

async function stopGeneration(): Promise<StudioConversationSnapshot> {
  const runtime = await getRuntime();
  if (runtime.session) {
    await runtime.session.abort();
  }
  await cancelCursorRun(chat.currentSessionId);
  chat.finishAssistantMessage("done");
  chat.status = "ready";
  chat.emitConversation();
  await chat.saveCurrentChatSession();
  await emitSessions();
  return chat.getConversationSnapshot();
}

async function getConversation(): Promise<StudioConversationSnapshot> {
  await chat.ensureChatSessionsLoaded();
  return chat.getConversationSnapshot();
}

async function newConversation(): Promise<StudioConversationSnapshot> {
  await chat.ensureChatSessionsLoaded();
  await chat.saveCurrentChatSession();
  const runtime = await getRuntime();
  await disposeRuntimeSession(runtime);
  await disposeCursorAgent(chat.currentSessionId);
  chat.messages = [];
  chat.status = "ready";
  chat.lastError = undefined;
  chat.currentSessionId = createId("session");
  chat.currentArtifactId = createId("artifact");
  await getDeckService().ensureArtifactWorkspace(chat.currentArtifactId);
  chat.emitConversation();
  await emitSessions();
  await emitDecks();
  return chat.getConversationSnapshot();
}

async function openChatSession(sessionId: string): Promise<StudioConversationSnapshot> {
  await chat.ensureChatSessionsLoaded();
  await chat.saveCurrentChatSession();
  const runtime = await getRuntime();
  await disposeRuntimeSession(runtime);
  await disposeCursorAgent(chat.currentSessionId);
  const session = chat.chatSessions.find((candidate) => candidate.id === sessionId);
  if (!session) throw new Error("Chat session not found.");
  chat.currentSessionId = session.id;
  chat.currentArtifactId = session.artifactId;
  chat.messages = session.messages;
  chat.status = "ready";
  chat.lastError = undefined;
  chat.emitConversation();
  await emitSessions();
  await emitDecks();
  return chat.getConversationSnapshot();
}

async function deleteChatSession(
  input: StudioDeleteChatSessionInput,
): Promise<StudioConversationSnapshot> {
  await chat.ensureChatSessionsLoaded();
  chat.chatSessions = chat.chatSessions.filter((session) => session.id !== input.sessionId);
  await chat.persistChatSessions();

  if (input.sessionId === chat.currentSessionId) {
    const runtime = await getRuntime();
    await disposeRuntimeSession(runtime);
    await disposeCursorAgent(chat.currentSessionId);
    chat.messages = [];
    chat.status = "ready";
    chat.lastError = undefined;
    chat.currentSessionId = createId("session");
    chat.currentArtifactId = createId("artifact");
    await getDeckService().ensureArtifactWorkspace(chat.currentArtifactId);
    chat.emitConversation();
  }

  await emitSessions();
  await emitDecks();
  return chat.getConversationSnapshot();
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
  const cwd = await getDeckService().ensureArtifactWorkspace(chat.currentArtifactId);
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
  runtime.unsubscribe = runtime.session.subscribe((event) => chat.handlePiEvent(event));
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
  chat.clearAssistantStreamState();
}

async function emitDecks(): Promise<void> {
  await chat.emitDecks();
}

async function emitSessions(): Promise<void> {
  await chat.emitSessions();
}

async function emitAuth(): Promise<void> {
  emit({ type: "auth", payload: await getAuthStatus() });
}

function emit(event: StudioEvent): void {
  mainWindow?.webContents.send("studio:event", event);
}

function waitForManualCode(): Promise<string> {
  return new Promise((resolve) => {
    manualCodeResolver = resolve;
  });
}

function getDeckService(): StudioDeckService {
  deckService ??= new StudioDeckService(join(app.getPath("userData"), "artifacts"));
  return deckService;
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
