import { app, BrowserWindow, ipcMain, shell } from "electron";
import { homedir } from "node:os";
import { join } from "node:path";

import type {
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioConversationSnapshot,
  StudioCustomModelRow,
  StudioEvent,
  StudioLoginState,
  StudioMessage,
  StudioModelInfo,
  StudioOAuthProviderInfo,
  StudioRemoveCustomModelInput,
  StudioSelectModelInput,
  StudioSendPromptInput,
  StudioStartLoginInput,
  StudioDisconnectProviderInput,
  StudioSubmitLoginCodeInput,
  StudioSetRuntimeKeyInput,
} from "../shared/studio-api";
import {
  addCustomProviderEntry,
  listCustomModelRows,
  readModelsJson,
  removeCustomModelEntry,
  writeModelsJson,
} from "./models-json";

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
  assistantMessageEvent?: {
    type: string;
    delta?: string;
    text?: string;
  };
  messages?: unknown[];
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

const PI_AUTH_DOCS_URL = "https://pi.dev/docs/latest/providers";
const PI_MODELS_DOCS_URL = "https://pi.dev/docs/latest/models";
const STUDIO_SYSTEM_PROMPT = [
  "You are Studio, an open-source Claude Design-style design partner.",
  "For this first milestone, focus on clear back-and-forth conversation.",
  "If the user asks for slides, first discuss the deck plan before generating files.",
].join("\n");

let runtimePromise: Promise<PiRuntime> | undefined;
let mainWindow: BrowserWindow | undefined;
let messages: StudioMessage[] = [];
let status: StudioConversationSnapshot["status"] = "ready";
let lastError: string | undefined;
let loginState: StudioLoginState = { status: "idle" };
let manualCodeResolver: ((code: string) => void) | undefined;

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
  ipcMain.handle("studio:submit-login-code", (_event, input: StudioSubmitLoginCodeInput) =>
    submitLoginCode(input),
  );
  ipcMain.handle("studio:select-model", (_event, input: StudioSelectModelInput) =>
    selectModel(input),
  );
  ipcMain.handle("studio:get-conversation", () => getConversationSnapshot());
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
  ipcMain.handle("studio:remove-custom-model", (_event, input: StudioRemoveCustomModelInput) =>
    removeCustomModel(input),
  );
}

async function getRuntime(): Promise<PiRuntime> {
  runtimePromise ??= createRuntime();
  return runtimePromise;
}

async function createRuntime(): Promise<PiRuntime> {
  const [{ AuthStorage, ModelRegistry }, { getModel }] = await Promise.all([
    import("@mariozechner/pi-coding-agent") as Promise<PiCodingAgent>,
    import("@mariozechner/pi-ai") as Promise<PiAi>,
  ]);

  const authStorage = AuthStorage.create();
  const modelRegistry = ModelRegistry.create(authStorage);
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
        : "No Pi models are authenticated yet. Add a BYOK runtime key here, set an API key env var, or run `pi` then `/login`.",
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

  const runtime = await getRuntime();
  if (input.modelId) {
    await selectModel({ modelId: input.modelId });
  }

  const userMessage: StudioMessage = {
    id: createId("user"),
    role: "user",
    content,
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
  status = "submitted";
  lastError = undefined;
  emitConversation();

  const session = await ensureSession(runtime);
  status = "streaming";
  emitConversation();

  session
    .prompt(content)
    .then(() => {
      finishAssistantMessage("done");
      status = "ready";
      emitConversation();
    })
    .catch((error: unknown) => {
      finishAssistantMessage("error");
      status = "error";
      lastError = error instanceof Error ? error.message : String(error);
      appendAssistantText(`\n\n${lastError}`);
      emitConversation();
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
  return getConversationSnapshot();
}

async function newConversation(): Promise<StudioConversationSnapshot> {
  const runtime = await getRuntime();
  if (runtime.session) {
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
  messages = [];
  status = "ready";
  lastError = undefined;
  emitConversation();
  return getConversationSnapshot();
}

async function ensureSession(runtime: PiRuntime): Promise<PiSession> {
  if (runtime.session) return runtime.session;

  const { createAgentSession, DefaultResourceLoader, SessionManager, createReadOnlyTools } =
    await import("@mariozechner/pi-coding-agent");
  const cwd = app.getPath("userData");
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir: getPiAgentDir(),
    systemPromptOverride: () => STUDIO_SYSTEM_PROMPT,
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    cwd,
    model: runtime.selectedModel as never,
    authStorage: runtime.authStorage as never,
    modelRegistry: runtime.modelRegistry as never,
    resourceLoader,
    sessionManager: SessionManager.inMemory(),
    tools: createReadOnlyTools(cwd) as never,
  });

  runtime.session = session as PiSession;
  runtime.unsubscribe = runtime.session.subscribe(handlePiEvent);
  return runtime.session;
}

function handlePiEvent(event: PiSessionEvent): void {
  if (event.type !== "message_update") return;

  const assistantEvent = event.assistantMessageEvent;
  if (!assistantEvent) return;

  if (assistantEvent.type === "text_delta" && assistantEvent.delta) {
    appendAssistantText(assistantEvent.delta);
    emitConversation();
  }

  if (assistantEvent.type === "text_end" && assistantEvent.text) {
    replaceStreamingAssistantText(assistantEvent.text);
    emitConversation();
  }
}

function getConversationSnapshot(): StudioConversationSnapshot {
  return {
    status,
    messages,
    selectedModelId: undefined,
    error: lastError,
  };
}

function appendAssistantText(delta: string): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    return { ...message, content: `${message.content}${delta}` };
  });
}

function replaceStreamingAssistantText(text: string): void {
  messages = messages.map((message, index) => {
    if (index !== messages.length - 1 || message.role !== "assistant") return message;
    return { ...message, content: text };
  });
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

/** Pi agent config dir; matches pi-coding-agent getAgentDir without a static ESM import (Electron main is CJS, package exports are import-only). */
function getPiAgentDir(): string {
  const envDir = process.env.PI_CODING_AGENT_DIR;
  if (envDir) {
    if (envDir === "~") return homedir();
    if (envDir.startsWith("~/")) return homedir() + envDir.slice(1);
    return envDir;
  }
  return join(homedir(), ".pi", "agent");
}

function getModelsJsonPath(): string {
  return join(getPiAgentDir(), "models.json");
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
