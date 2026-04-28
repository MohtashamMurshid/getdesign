import { contextBridge, ipcRenderer } from "electron";
import type {
  StudioAddCustomProviderInput,
  StudioApi,
  StudioEvent,
  StudioRemoveCustomModelInput,
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
  submitLoginCode: (input: StudioSubmitLoginCodeInput) =>
    ipcRenderer.invoke("studio:submit-login-code", input),
  selectModel: (input: StudioSelectModelInput) =>
    ipcRenderer.invoke("studio:select-model", input),
  getConversation: () => ipcRenderer.invoke("studio:get-conversation"),
  sendPrompt: (input: StudioSendPromptInput) =>
    ipcRenderer.invoke("studio:send-prompt", input),
  stop: () => ipcRenderer.invoke("studio:stop"),
  newConversation: () => ipcRenderer.invoke("studio:new-conversation"),
  openPiAuthDocs: () => ipcRenderer.invoke("studio:open-pi-auth-docs"),
  openPiModelsDocs: () => ipcRenderer.invoke("studio:open-pi-models-docs"),
  addCustomProvider: (input: StudioAddCustomProviderInput) =>
    ipcRenderer.invoke("studio:add-custom-provider", input),
  removeCustomModel: (input: StudioRemoveCustomModelInput) =>
    ipcRenderer.invoke("studio:remove-custom-model", input),
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
