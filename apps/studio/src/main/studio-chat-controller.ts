import { mkdir, readFile, writeFile } from "node:fs/promises";

import type {
  StudioChatSessionSummary,
  StudioConversationSnapshot,
  StudioDeckProject,
  StudioEvent,
  StudioMessage,
  StudioMessagePart,
  StudioRenameChatSessionInput,
} from "../shared/studio-api";
import type { StudioDeckService } from "./deck-service";
import { createId, createIdSuffix } from "./pi/id-utils";
import {
  computeContentFromParts,
  extractTitleFromAssistantMessage,
  getSessionTitle,
  isArtifactFileTool,
  toAgentElementsToolName,
  truncate,
} from "./pi/message-text";
import { getChatSessionsPath, getPiAgentDir } from "./pi/paths";
import { asRecord } from "./pi/record-utils";
import { isStoredChatSession } from "./pi/chat-guards";
import type {
  PiRuntime,
  PiSessionEvent,
  StoredChatSession,
  AssistantStreamState,
} from "./pi/types";
import { createAssistantStreamState } from "./pi/types";
import { makeAssistantStreamKey } from "./studio-stream-key";

export type StudioChatControllerDeps = {
  emit: (event: StudioEvent) => void;
  getDeckService: () => StudioDeckService;
};

/**
 * Owns Studio chat state: active session ids, message list, streaming indices,
 * persistence of chat sessions, and Pi assistant-message mutations.
 * IPC handlers stay in pi-service; this module is the seam for conversation behaviour.
 */
export class StudioChatController {
  readonly deps: StudioChatControllerDeps;

  currentSessionId = createId("session");
  messages: StudioMessage[] = [];
  status: StudioConversationSnapshot["status"] = "ready";
  lastError: string | undefined;
  currentArtifactId = createId("artifact");
  assistantStream: AssistantStreamState = createAssistantStreamState();
  chatSessions: StoredChatSession[] = [];
  sessionsLoaded = false;

  constructor(deps: StudioChatControllerDeps) {
    this.deps = deps;
  }

  getConversationSnapshot(): StudioConversationSnapshot {
    return {
      id: this.currentSessionId,
      status: this.status,
      messages: this.messages,
      selectedModelId: undefined,
      currentArtifactId: this.currentArtifactId,
      error: this.lastError,
    };
  }

  emitConversation(): void {
    this.deps.emit({ type: "conversation", payload: this.getConversationSnapshot() });
  }

  async listDecksForCurrentArtifact(): Promise<StudioDeckProject[]> {
    const deck = await this.deps.getDeckService().readArtifactDeck(this.currentArtifactId);
    return deck ? [deck] : [];
  }

  async emitDecks(): Promise<void> {
    this.deps.emit({ type: "decks", payload: await this.listDecksForCurrentArtifact() });
  }

  async emitSessions(): Promise<void> {
    this.deps.emit({ type: "sessions", payload: await this.listChatSessionSummaries() });
  }

  clearAssistantStreamState(): void {
    this.assistantStream = createAssistantStreamState();
  }

  handlePiEvent(event: PiSessionEvent): void {
    if (event.type === "message_start") {
      this.assistantStream.turn += 1;
      return;
    }

    if (event.type === "tool_execution_start") {
      this.updateToolPart(event.toolCallId, event.toolName, {
        input: event.args,
        state: "input-available",
      });
      this.emitConversation();
      return;
    }

    if (event.type === "tool_execution_update") {
      this.updateToolPart(event.toolCallId, event.toolName, {
        input: event.args,
        output: event.partialResult,
        result: event.partialResult,
        state: "input-available",
      });
      this.emitConversation();
      return;
    }

    if (event.type === "tool_execution_end") {
      this.updateToolPart(event.toolCallId, event.toolName, {
        output: event.result,
        result: event.result,
        state: event.isError ? "output-error" : "output-available",
      });
      this.emitConversation();
      if (!event.isError && isArtifactFileTool(event.toolName)) {
        void this.emitDecks();
      }
      return;
    }

    if (event.type === "message_end" && event.message) {
      this.backfillFromMessage(event.message);
      this.emitConversation();
      return;
    }

    if (event.type !== "message_update") return;

    const assistantEvent = event.assistantMessageEvent;
    if (!assistantEvent) return;

    switch (assistantEvent.type) {
      case "text_start":
        this.ensureTextPart(assistantEvent.contentIndex, "");
        break;
      case "text_delta":
        if (typeof assistantEvent.delta === "string" && assistantEvent.delta) {
          this.appendStreamingText(assistantEvent.contentIndex, assistantEvent.delta);
          this.emitConversation();
        }
        break;
      case "text_end":
        if (typeof assistantEvent.content === "string") {
          this.finalizeStreamingText(assistantEvent.contentIndex, assistantEvent.content);
          this.emitConversation();
        }
        break;
      case "thinking_start":
        this.ensureThinkingPart(assistantEvent.contentIndex, "");
        this.emitConversation();
        break;
      case "thinking_delta":
        if (typeof assistantEvent.delta === "string" && assistantEvent.delta) {
          this.appendStreamingThinking(assistantEvent.contentIndex, assistantEvent.delta);
          this.emitConversation();
        }
        break;
      case "thinking_end":
        if (
          typeof assistantEvent.content === "string" ||
          typeof assistantEvent.thinking === "string"
        ) {
          this.finalizeStreamingThinking(
            assistantEvent.contentIndex,
            (assistantEvent.content ?? assistantEvent.thinking)!,
          );
          this.emitConversation();
        } else {
          this.finalizeStreamingThinking(assistantEvent.contentIndex);
          this.emitConversation();
        }
        break;
      case "toolcall_end":
        if (assistantEvent.toolCall) {
          this.upsertAssistantToolCall(assistantEvent.toolCall);
          this.emitConversation();
        }
        break;
    }
  }

  appendStreamingText(contentIndex: number | undefined, delta: string): void {
    if (!delta) return;
    const key = this.streamKey(contentIndex);
    this.mutateAssistantParts((parts) => {
      let index = this.assistantStream.textIndices.get(key);
      if (index === undefined || !parts[index] || parts[index]!.type !== "text") {
        const next = [...parts, { type: "text" as const, text: delta }];
        this.assistantStream.textIndices.set(key, next.length - 1);
        return next;
      }
      const target = parts[index] as StudioMessagePart;
      const updated: StudioMessagePart = { ...target, text: `${target.text ?? ""}${delta}` };
      return parts.map((part, i) => (i === index ? updated : part));
    });
  }

  appendStreamingThinking(contentIndex: number | undefined, delta: string): void {
    if (!delta) return;
    const key = this.streamKey(contentIndex);
    this.ensureThinkingPart(contentIndex, "");
    this.mutateAssistantParts((parts) => {
      const index = this.assistantStream.thinkingIndices.get(key);
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

  finalizeStreamingThinking(contentIndex: number | undefined, finalText?: string): void {
    const key = this.streamKey(contentIndex);
    this.mutateAssistantParts((parts) => {
      const index = this.assistantStream.thinkingIndices.get(key);
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

  finishAssistantMessage(nextStatus: NonNullable<StudioMessage["status"]>): void {
    this.messages = this.messages.map((message, index) => {
      if (index !== this.messages.length - 1 || message.role !== "assistant") return message;
      return { ...message, status: nextStatus };
    });
  }

  async ensureChatSessionsLoaded(): Promise<void> {
    if (this.sessionsLoaded) return;
    this.sessionsLoaded = true;
    try {
      const raw = await readFile(getChatSessionsPath(), "utf8");
      const parsed = JSON.parse(raw) as unknown;
      this.chatSessions = Array.isArray(parsed)
        ? parsed.filter(isStoredChatSession).sort((a, b) => b.updatedAt - a.updatedAt)
        : [];
    } catch {
      this.chatSessions = [];
    }
  }

  async saveCurrentChatSession(): Promise<void> {
    await this.ensureChatSessionsLoaded();
    if (this.messages.length === 0) return;
    const now = Date.now();
    const existing = this.chatSessions.find((session) => session.id === this.currentSessionId);
    const session: StoredChatSession = {
      id: this.currentSessionId,
      title: existing?.manualTitle ? existing.title : getSessionTitle(this.messages),
      artifactId: this.currentArtifactId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      messages: this.messages,
      manualTitle: existing?.manualTitle,
    };
    this.chatSessions = [
      session,
      ...this.chatSessions.filter((candidate) => candidate.id !== this.currentSessionId),
    ].sort((a, b) => b.updatedAt - a.updatedAt);
    await this.persistChatSessions();
  }

  async persistChatSessions(): Promise<void> {
    await mkdir(getPiAgentDir(), { recursive: true });
    await writeFile(getChatSessionsPath(), JSON.stringify(this.chatSessions, null, 2), "utf8");
  }

  async listChatSessionSummaries(): Promise<StudioChatSessionSummary[]> {
    await this.ensureChatSessionsLoaded();
    await this.saveCurrentChatSession();
    return this.chatSessions.map(({ messages: _messages, ...summary }) => summary);
  }

  async maybeGenerateSessionTitle(
    sessionId: string,
    getRuntime: () => Promise<PiRuntime>,
  ): Promise<void> {
    const session = this.chatSessions.find((candidate) => candidate.id === sessionId);
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

      const stored = this.chatSessions.find((candidate) => candidate.id === sessionId);
      if (!stored || stored.manualTitle) return;
      stored.title = title;
      await this.persistChatSessions();
      await this.emitSessions();
    } catch {
      // Title generation is best-effort; keep the heuristic title on failure.
    }
  }

  async renameChatSession(input: StudioRenameChatSessionInput): Promise<StudioChatSessionSummary[]> {
    await this.ensureChatSessionsLoaded();
    const title = input.title.trim().slice(0, 64);
    if (!title) throw new Error("Chat title is required.");
    const target = this.chatSessions.find((session) => session.id === input.sessionId);
    if (!target) throw new Error("Chat session not found.");
    target.title = title;
    target.manualTitle = true;
    target.updatedAt = Date.now();
    await this.persistChatSessions();
    await this.emitSessions();
    return this.chatSessions.map(({ messages: _messages, ...summary }) => summary);
  }

  private mutateAssistantParts(
    mutator: (parts: StudioMessagePart[]) => StudioMessagePart[],
  ): void {
    this.messages = this.messages.map((message, index) => {
      if (index !== this.messages.length - 1 || message.role !== "assistant") return message;
      const nextParts = mutator(message.parts ?? []);
      if (nextParts === message.parts) return message;
      return {
        ...message,
        parts: nextParts,
        content: computeContentFromParts(nextParts),
      };
    });
  }

  private streamKey(contentIndex: number | undefined): string {
    return makeAssistantStreamKey(this.assistantStream.turn, contentIndex);
  }

  private ensureTextPart(contentIndex: number | undefined, initialText: string): void {
    const key = this.streamKey(contentIndex);
    if (this.assistantStream.textIndices.has(key)) return;
    this.mutateAssistantParts((parts) => {
      const next = [...parts, { type: "text" as const, text: initialText }];
      this.assistantStream.textIndices.set(key, next.length - 1);
      return next;
    });
  }

  private finalizeStreamingText(contentIndex: number | undefined, finalText: string): void {
    const key = this.streamKey(contentIndex);
    this.mutateAssistantParts((parts) => {
      const index = this.assistantStream.textIndices.get(key);
      if (index === undefined || !parts[index] || parts[index]!.type !== "text") {
        const next = [...parts, { type: "text" as const, text: finalText }];
        this.assistantStream.textIndices.set(key, next.length - 1);
        return next;
      }
      return parts.map((part, i) =>
        i === index ? ({ ...part, text: finalText } as StudioMessagePart) : part,
      );
    });
  }

  private ensureThinkingPart(contentIndex: number | undefined, initialText: string): void {
    const key = this.streamKey(contentIndex);
    if (this.assistantStream.thinkingIndices.has(key)) return;
    this.mutateAssistantParts((parts) => {
      const part: StudioMessagePart = {
        type: "tool-Thinking",
        toolCallId: `thinking-${this.assistantStream.turn}-${contentIndex ?? "x"}-${createIdSuffix()}`,
        state: "input-streaming",
        input: { thought: initialText },
        output: initialText,
      };
      const next = [...parts, part];
      this.assistantStream.thinkingIndices.set(key, next.length - 1);
      return next;
    });
  }

  private upsertAssistantToolCall(toolCall: unknown): void {
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
    this.insertOrUpdateToolPart(part);
  }

  private updateToolPart(
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
    this.insertOrUpdateToolPart(part);
  }

  private insertOrUpdateToolPart(part: StudioMessagePart): void {
    if (!part.toolCallId) return;
    const toolCallId = part.toolCallId;
    this.mutateAssistantParts((parts) => {
      const existingIndex =
        this.assistantStream.toolIndices.get(toolCallId) ??
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
        this.assistantStream.toolIndices.set(toolCallId, existingIndex);
        return parts.map((candidate, i) => (i === existingIndex ? merged : candidate));
      }
      const next = [...parts, part];
      this.assistantStream.toolIndices.set(toolCallId, next.length - 1);
      return next;
    });
  }

  private backfillFromMessage(piMessage: unknown): void {
    const record = asRecord(piMessage);
    if (!record || record["role"] !== "assistant" || !Array.isArray(record["content"])) return;
    for (const block of record["content"]) {
      const item = asRecord(block);
      if (!item) continue;
      if (item["type"] === "thinking" && typeof item["thinking"] === "string") {
        const text = item["thinking"];
        const alreadyHave = this.messages[this.messages.length - 1]?.parts?.some(
          (p) =>
            p.type === "tool-Thinking" &&
            typeof p.output === "string" &&
            p.output.trim() === text.trim(),
        );
        if (alreadyHave) continue;
        this.mutateAssistantParts((parts) => [
          ...parts,
          {
            type: "tool-Thinking",
            toolCallId: `thinking-backfill-${this.assistantStream.turn}-${createIdSuffix()}`,
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
        const haveTool = this.messages[this.messages.length - 1]?.parts?.some(
          (p) => p.toolCallId === id,
        );
        if (haveTool) continue;
        this.upsertAssistantToolCall(item);
      }
    }
  }
}
