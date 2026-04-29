import { contextBridge, ipcRenderer } from "electron";
import type {
  StudioAddCustomModelInput,
  StudioAddCustomProviderInput,
  StudioApi,
  StudioCreateDeckInput,
  StudioDeleteChatSessionInput,
  StudioEvent,
  StudioExportDeckInput,
  StudioRemoveCustomModelInput,
  StudioRenameChatSessionInput,
  StudioSelectModelInput,
  StudioSendPromptInput,
  StudioStartLoginInput,
  StudioDisconnectProviderInput,
  StudioSubmitLoginCodeInput,
  StudioSetRuntimeKeyInput,
} from "../shared/studio-api";

const api: StudioApi = {
  getAuthStatus: () => ipcRenderer.invoke("studio:get-auth-status"),
  setRuntimeApiKey: (input: StudioSetRuntimeKeyInput) =>
    ipcRenderer.invoke("studio:set-runtime-api-key", input),
  startLogin: (input: StudioStartLoginInput) =>
    ipcRenderer.invoke("studio:start-login", input),
  disconnectProvider: (input: StudioDisconnectProviderInput) =>
    ipcRenderer.invoke("studio:disconnect-provider", input),
  logoutAll: () => ipcRenderer.invoke("studio:logout-all"),
  submitLoginCode: (input: StudioSubmitLoginCodeInput) =>
    ipcRenderer.invoke("studio:submit-login-code", input),
  selectModel: (input: StudioSelectModelInput) =>
    ipcRenderer.invoke("studio:select-model", input),
  getConversation: () => ipcRenderer.invoke("studio:get-conversation"),
  listChatSessions: () => ipcRenderer.invoke("studio:list-chat-sessions"),
  openChatSession: (sessionId: string) =>
    ipcRenderer.invoke("studio:open-chat-session", sessionId),
  renameChatSession: (input: StudioRenameChatSessionInput) =>
    ipcRenderer.invoke("studio:rename-chat-session", input),
  deleteChatSession: (input: StudioDeleteChatSessionInput) =>
    ipcRenderer.invoke("studio:delete-chat-session", input),
  sendPrompt: (input: StudioSendPromptInput) =>
    ipcRenderer.invoke("studio:send-prompt", input),
  stop: () => ipcRenderer.invoke("studio:stop"),
  newConversation: () => ipcRenderer.invoke("studio:new-conversation"),
  openPiAuthDocs: () => ipcRenderer.invoke("studio:open-pi-auth-docs"),
  openPiModelsDocs: () => ipcRenderer.invoke("studio:open-pi-models-docs"),
  addCustomProvider: (input: StudioAddCustomProviderInput) =>
    ipcRenderer.invoke("studio:add-custom-provider", input),
  addCustomModel: (input: StudioAddCustomModelInput) =>
    ipcRenderer.invoke("studio:add-custom-model", input),
  removeCustomModel: (input: StudioRemoveCustomModelInput) =>
    ipcRenderer.invoke("studio:remove-custom-model", input),
  listDecks: () => ipcRenderer.invoke("studio:list-decks"),
  createDeck: (input?: StudioCreateDeckInput) =>
    ipcRenderer.invoke("studio:create-deck", input),
  getDeck: (deckId: string) => ipcRenderer.invoke("studio:get-deck", deckId),
  openDeck: (deckId: string) => ipcRenderer.invoke("studio:open-deck", deckId),
  revealPath: (path: string) => ipcRenderer.invoke("studio:reveal-path", path),
  exportDeck: (input: StudioExportDeckInput) =>
    ipcRenderer.invoke("studio:export-deck", input),
  onStudioEvent: (listener: (event: StudioEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: StudioEvent) => {
      listener(payload);
    };
    ipcRenderer.on("studio:event", handler);
    return () => ipcRenderer.removeListener("studio:event", handler);
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = StudioApi;
