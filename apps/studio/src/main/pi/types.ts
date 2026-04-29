import type { StudioChatSessionSummary, StudioMessage } from "../../shared/studio-api";

export type PiCodingAgent = typeof import("@mariozechner/pi-coding-agent");
export type PiAi = typeof import("@mariozechner/pi-ai");

export type PiSession = {
  prompt: (text: string) => Promise<void>;
  abort: () => Promise<void>;
  dispose: () => void;
  subscribe: (listener: (event: PiSessionEvent) => void) => () => void;
  setModel?: (model: unknown) => Promise<void>;
  model?: unknown;
};

export type PiSessionEvent = {
  type: string;
  message?: unknown;
  assistantMessageEvent?: {
    type: string;
    contentIndex?: number;
    delta?: string;
    text?: string;
    content?: string;
    thinking?: string;
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

export type PiRuntime = {
  authStorage: {
    setRuntimeApiKey: (provider: string, apiKey: string) => void;
    removeRuntimeApiKey: (provider: string) => void;
    logout: (provider: string) => void;
    login: (
      providerId: string,
      callbacks: {
        onAuth: (info: { url: string; instructions?: string }) => void;
        onPrompt: (prompt: {
          message: string;
          placeholder?: string;
          allowEmpty?: boolean;
        }) => Promise<string>;
        onProgress?: (message: string) => void;
        onManualCodeInput?: () => Promise<string>;
      },
    ) => Promise<void>;
    getOAuthProviders?: () => Array<{ id: string; name: string }>;
  };
  modelRegistry: {
    getAvailable: () => unknown[] | Promise<unknown[]>;
    find?: (provider: string, id: string) => unknown;
    refresh?: () => void | Promise<void>;
    getError?: () => string | undefined;
  };
  selectedModel?: unknown;
  selectedModelId?: string;
  modelRegistryRefreshed?: boolean;
  session?: PiSession;
  unsubscribe?: () => void;
};

/**
 * Tracks streaming part indices on the in-flight assistant message.
 */
export type AssistantStreamState = {
  textIndices: Map<string, number>;
  thinkingIndices: Map<string, number>;
  toolIndices: Map<string, number>;
  turn: number;
};

export function createAssistantStreamState(): AssistantStreamState {
  return {
    textIndices: new Map(),
    thinkingIndices: new Map(),
    toolIndices: new Map(),
    turn: 0,
  };
}

export type StoredChatSession = StudioChatSessionSummary & {
  messages: StudioMessage[];
  manualTitle?: boolean;
};
