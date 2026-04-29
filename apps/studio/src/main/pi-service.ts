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

import { isStoredChatSession } from "./pi/chat-guards";
import {
  PI_AUTH_DOCS_URL,
  PI_MODELS_DOCS_URL,
  STUDIO_SYSTEM_PROMPT,
} from "./pi/constants";
import { createId, createIdSuffix } from "./pi/id-utils";
import {
  findModel,
  getModelKey,
  getOAuthProviders,
  modelRegistryAsRuntime,
  splitModelId,
  toModelInfo,
} from "./pi/model-format";
import {
  computeContentFromParts,
  extractTitleFromAssistantMessage,
  getSessionTitle,
  isArtifactFileTool,
  toAgentElementsToolName,
  truncate,
} from "./pi/message-text";
import {
  getChatSessionsPath,
  getModelsJsonPath,
  getPiAgentDir,
  stripPiProviderEnvironment,
} from "./pi/paths";
import { asRecord } from "./pi/record-utils";
import type {
  PiAi,
  PiCodingAgent,
  PiRuntime,
  PiSession,
  PiSessionEvent,
  StoredChatSession,
} from "./pi/types";
import { createAssistantStreamState, type AssistantStreamState } from "./pi/types";
let mainWindow: BrowserWindow | undefined;
let runtimePromise: Promise<PiRuntime> | undefined;
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
let assistantStream: AssistantStreamState = createAssistantStreamState();

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
  assistantStream = createAssistantStreamState();
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
      appendStreamingText(undefined, `\n\n${lastError}`);
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
  assistantStream = createAssistantStreamState();
}

function handlePiEvent(event: PiSessionEvent): void {
  if (event.type === "message_start") {
    // A new LLM turn begins inside this assistant message. Bump the turn so
    // contentIndex pointers from the previous turn don't collide with the
    // ones the next turn will emit (both turns start counting from 0 again).
    assistantStream.turn += 1;
    return;
  }

  if (event.type === "tool_execution_start") {
    updateToolPart(event.toolCallId, event.toolName, {
      input: event.args,
      state: "input-available",
    });
    emitConversation();
    return;
  }

  if (event.type === "tool_execution_update") {
    updateToolPart(event.toolCallId, event.toolName, {
      input: event.args,
      output: event.partialResult,
      result: event.partialResult,
      state: "input-available",
    });
    emitConversation();
    return;
  }

  if (event.type === "tool_execution_end") {
    updateToolPart(event.toolCallId, event.toolName, {
      output: event.result,
      result: event.result,
      state: event.isError ? "output-error" : "output-available",
    });
    emitConversation();
    if (!event.isError && isArtifactFileTool(event.toolName)) {
      void emitDecks();
    }
    return;
  }

  if (event.type === "message_end" && event.message) {
    // Streaming events maintain authoritative ordering and content. We only
    // backfill anything that didn't make it through the stream — primarily
    // legacy thinking blocks for providers that don't emit thinking_delta.
    backfillFromMessage(event.message);
    emitConversation();
    return;
  }

  if (event.type !== "message_update") return;

  const assistantEvent = event.assistantMessageEvent;
  if (!assistantEvent) return;

  switch (assistantEvent.type) {
    case "text_start":
      ensureTextPart(assistantEvent.contentIndex, "");
      break;
    case "text_delta":
      if (typeof assistantEvent.delta === "string" && assistantEvent.delta) {
        appendStreamingText(assistantEvent.contentIndex, assistantEvent.delta);
        emitConversation();
      }
      break;
    case "text_end":
      if (typeof assistantEvent.content === "string") {
        finalizeStreamingText(assistantEvent.contentIndex, assistantEvent.content);
        emitConversation();
      }
      break;
    case "thinking_start":
      ensureThinkingPart(assistantEvent.contentIndex, "");
      emitConversation();
      break;
    case "thinking_delta":
      if (typeof assistantEvent.delta === "string" && assistantEvent.delta) {
        appendStreamingThinking(assistantEvent.contentIndex, assistantEvent.delta);
        emitConversation();
      }
      break;
    case "thinking_end":
      if (
        typeof assistantEvent.content === "string" ||
        typeof assistantEvent.thinking === "string"
      ) {
        finalizeStreamingThinking(
          assistantEvent.contentIndex,
          (assistantEvent.content ?? assistantEvent.thinking)!,
        );
        emitConversation();
      } else {
        finalizeStreamingThinking(assistantEvent.contentIndex);
        emitConversation();
      }
      break;
    case "toolcall_end":
      if (assistantEvent.toolCall) {
        upsertAssistantToolCall(assistantEvent.toolCall);
        emitConversation();
      }
      break;
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

/* ----------------------------------------------------------------------- */
/* Assistant message mutation helpers                                       */
/* ----------------------------------------------------------------------- */

function mutateAssistantParts(
  mutator: (parts: StudioMessagePart[]) => StudioMessagePart[],
): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    const nextParts = mutator(message.parts ?? []);
    if (nextParts === message.parts) return message;
    return {
      ...message,
      parts: nextParts,
      content: computeContentFromParts(nextParts),
    };
  });
}

function streamKey(contentIndex: number | undefined): string {
  // Each LLM turn within an assistant message gets its own contentIndex
  // namespace, so combine turn + contentIndex. `contentIndex` may be
  // undefined for providers that don't emit it; in that case we fall back to
  // `null` and the helpers below use append-style fallbacks.
  return `${assistantStream.turn}:${contentIndex ?? "null"}`;
}

function ensureTextPart(contentIndex: number | undefined, initialText: string): void {
  const key = streamKey(contentIndex);
  if (assistantStream.textIndices.has(key)) return;
  mutateAssistantParts((parts) => {
    const next = [...parts, { type: "text" as const, text: initialText }];
    assistantStream.textIndices.set(key, next.length - 1);
    return next;
  });
}

function appendStreamingText(contentIndex: number | undefined, delta: string): void {
  if (!delta) return;
  const key = streamKey(contentIndex);
  mutateAssistantParts((parts) => {
    let index = assistantStream.textIndices.get(key);
    if (index === undefined || !parts[index] || parts[index]!.type !== "text") {
      const next = [...parts, { type: "text" as const, text: delta }];
      assistantStream.textIndices.set(key, next.length - 1);
      return next;
    }
    const target = parts[index] as StudioMessagePart;
    const updated: StudioMessagePart = { ...target, text: `${target.text ?? ""}${delta}` };
    return parts.map((part, i) => (i === index ? updated : part));
  });
}

function finalizeStreamingText(contentIndex: number | undefined, finalText: string): void {
  const key = streamKey(contentIndex);
  mutateAssistantParts((parts) => {
    const index = assistantStream.textIndices.get(key);
    if (index === undefined || !parts[index] || parts[index]!.type !== "text") {
      const next = [...parts, { type: "text" as const, text: finalText }];
      assistantStream.textIndices.set(key, next.length - 1);
      return next;
    }
    return parts.map((part, i) =>
      i === index ? ({ ...part, text: finalText } as StudioMessagePart) : part,
    );
  });
}

function ensureThinkingPart(contentIndex: number | undefined, initialText: string): void {
  const key = streamKey(contentIndex);
  if (assistantStream.thinkingIndices.has(key)) return;
  mutateAssistantParts((parts) => {
    const part: StudioMessagePart = {
      type: "tool-Thinking",
      toolCallId: `thinking-${assistantStream.turn}-${contentIndex ?? "x"}-${createIdSuffix()}`,
      state: "input-streaming",
      input: { thought: initialText },
      output: initialText,
    };
    const next = [...parts, part];
    assistantStream.thinkingIndices.set(key, next.length - 1);
    return next;
  });
}

function appendStreamingThinking(contentIndex: number | undefined, delta: string): void {
  if (!delta) return;
  const key = streamKey(contentIndex);
  ensureThinkingPart(contentIndex, "");
  mutateAssistantParts((parts) => {
    const index = assistantStream.thinkingIndices.get(key);
    if (index === undefined || !parts[index]) return parts;
    const target = parts[index]!;
    const prevText = typeof target.output === "string" ? target.output : "";
    const nextText = `${prevText}${delta}`;
    const updated: StudioMessagePart = {
      ...target,
      state: "input-streaming",
      input: { ...(target.input as Record<string, unknown> | undefined), thought: nextText },
      output: nextText,
    };
    return parts.map((part, i) => (i === index ? updated : part));
  });
}

function finalizeStreamingThinking(
  contentIndex: number | undefined,
  finalText?: string,
): void {
  const key = streamKey(contentIndex);
  mutateAssistantParts((parts) => {
    const index = assistantStream.thinkingIndices.get(key);
    if (index === undefined || !parts[index]) return parts;
    const target = parts[index]!;
    const text =
      typeof finalText === "string"
        ? finalText
        : typeof target.output === "string"
          ? target.output
          : "";
    const updated: StudioMessagePart = {
      ...target,
      state: "output-available",
      input: { ...(target.input as Record<string, unknown> | undefined), thought: text },
      output: text,
      result: text,
    };
    return parts.map((part, i) => (i === index ? updated : part));
  });
}

function upsertAssistantToolCall(toolCall: unknown): void {
  const record = asRecord(toolCall);
  if (!record) return;
  const id = record["id"];
  const name = record["name"];
  if (typeof id !== "string" || typeof name !== "string") return;
  const part: StudioMessagePart = {
    type: `tool-${toAgentElementsToolName(name)}`,
    toolCallId: id,
    state: "input-available",
    input: record["arguments"] ?? {},
  };
  insertOrUpdateToolPart(part);
}

function updateToolPart(
  toolCallId: unknown,
  toolName: unknown,
  patch: Partial<StudioMessagePart>,
): void {
  if (typeof toolCallId !== "string" || typeof toolName !== "string") return;
  const part: StudioMessagePart = {
    type: `tool-${toAgentElementsToolName(toolName)}`,
    toolCallId,
    ...patch,
  };
  insertOrUpdateToolPart(part);
}

function insertOrUpdateToolPart(part: StudioMessagePart): void {
  if (!part.toolCallId) return;
  const toolCallId = part.toolCallId;
  mutateAssistantParts((parts) => {
    const existingIndex =
      assistantStream.toolIndices.get(toolCallId) ??
      parts.findIndex((candidate) => candidate.toolCallId === toolCallId);
    if (existingIndex !== undefined && existingIndex >= 0 && parts[existingIndex]) {
      const target = parts[existingIndex]!;
      const merged: StudioMessagePart = {
        ...target,
        ...part,
        input: part.input ?? target.input,
        output: part.output ?? target.output,
        result: part.result ?? target.result,
        state: part.state ?? target.state,
      };
      assistantStream.toolIndices.set(toolCallId, existingIndex);
      return parts.map((candidate, i) => (i === existingIndex ? merged : candidate));
    }
    const next = [...parts, part];
    assistantStream.toolIndices.set(toolCallId, next.length - 1);
    return next;
  });
}

/**
 * Backfill anything Pi reported in its authoritative content array that the
 * streaming events didn't already capture. With proper text/thinking/tool
 * streaming this is largely a no-op, but it keeps us robust against
 * providers that omit thinking deltas.
 */
function backfillFromMessage(piMessage: unknown): void {
  const record = asRecord(piMessage);
  if (!record || record["role"] !== "assistant" || !Array.isArray(record["content"])) return;
  for (const block of record["content"]) {
    const item = asRecord(block);
    if (!item) continue;
    if (item["type"] === "thinking" && typeof item["thinking"] === "string") {
      const text = item["thinking"];
      const alreadyHave = messages[messages.length - 1]?.parts?.some(
        (p) =>
          p.type === "tool-Thinking" &&
          typeof p.output === "string" &&
          p.output.trim() === text.trim(),
      );
      if (alreadyHave) continue;
      mutateAssistantParts((parts) => [
        ...parts,
        {
          type: "tool-Thinking",
          toolCallId: `thinking-backfill-${assistantStream.turn}-${createIdSuffix()}`,
          state: "output-available",
          input: { thought: text },
          output: text,
          result: text,
        } as StudioMessagePart,
      ]);
      continue;
    }
    if (item["type"] === "toolCall") {
      const id = item["id"];
      if (typeof id !== "string") continue;
      const haveTool = messages[messages.length - 1]?.parts?.some(
        (p) => p.toolCallId === id,
      );
      if (haveTool) continue;
      upsertAssistantToolCall(item);
    }
  }
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

function waitForManualCode(): Promise<string> {
  return new Promise((resolve) => {
    manualCodeResolver = resolve;
  });
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
