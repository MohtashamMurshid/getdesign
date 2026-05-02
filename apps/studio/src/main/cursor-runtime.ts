/**
 * Per-session Cursor SDK runtime for Studio.
 *
 * Studio's chat surface streams events into a shared `messages[]` array owned
 * by `pi-service.ts`. To keep that ownership intact, this module exposes
 * callback-driven helpers so pi-service can plug in its existing
 * `appendStreamingText` / `emitConversation` / persistence helpers without
 * having to leak module state.
 *
 * Stream events are mapped through `dispatchCursorStreamEvent` so transport
 * stays separate from how deltas are produced.
 *
 * The Cursor SDK is loaded lazily so a missing/native-build failure of
 * `@cursor/sdk` doesn't crash the rest of Studio.
 */

import { bareCursorModelId } from "../shared/cursor-model-id";
import { normalizeCursorSdkImportError } from "./cursor-import-error";
import { dispatchCursorStreamEvent } from "./cursor-stream-dispatch";
import { toCursorRunErrorMessage } from "./cursor-runtime-errors";

type CursorSdkModule = typeof import("@cursor/sdk");
type SDKAgent = Awaited<ReturnType<CursorSdkModule["Agent"]["create"]>>;
type SDKRun = Awaited<ReturnType<SDKAgent["send"]>>;

export type CursorRunCallbacks = {
  onTextDelta(delta: string): void;
  onThinkingDelta(delta: string): void;
  /** Called once the stream completes successfully. */
  onFinish(): void;
  /** Called when the run errors or the SDK throws synchronously. */
  onError(message: string): void;
  /** Called when the run was cancelled by the user. */
  onCancel(): void;
};

type SessionEntry = {
  agent: SDKAgent;
  modelId: string;
  cwd: string;
  apiKey: string;
};

const sessions = new Map<string, SessionEntry>();
const activeRuns = new Map<string, SDKRun>();

let sdkPromise: Promise<CursorSdkModule> | undefined;

async function getSdk(): Promise<CursorSdkModule> {
  sdkPromise ??= (async () => {
    try {
      return (await import("@cursor/sdk")) as CursorSdkModule;
    } catch (error) {
      sdkPromise = undefined;
      throw normalizeCursorSdkImportError(error);
    }
  })();
  return sdkPromise;
}

async function getOrCreateAgent(
  sessionId: string,
  modelId: string,
  cwd: string,
  apiKey: string,
): Promise<SDKAgent> {
  const existing = sessions.get(sessionId);
  if (
    existing &&
    existing.modelId === modelId &&
    existing.cwd === cwd &&
    existing.apiKey === apiKey
  ) {
    return existing.agent;
  }

  if (existing) {
    // Model, workspace, or credential changed; dispose before starting a new agent.
    await disposeCursorAgent(sessionId);
  }

  const sdk = await getSdk();
  const agent = await sdk.Agent.create({
    apiKey,
    model: { id: bareCursorModelId(modelId) },
    local: { cwd },
  });
  sessions.set(sessionId, { agent, modelId, cwd, apiKey });
  return agent;
}

export async function runCursorPrompt(input: {
  sessionId: string;
  modelId: string;
  cwd: string;
  apiKey: string;
  prompt: string;
  callbacks: CursorRunCallbacks;
}): Promise<void> {
  const { sessionId, modelId, cwd, apiKey, prompt, callbacks } = input;

  let run: SDKRun;
  try {
    const agent = await getOrCreateAgent(sessionId, modelId, cwd, apiKey);
    run = await agent.send(prompt);
  } catch (error) {
    callbacks.onError(toCursorRunErrorMessage(error));
    return;
  }

  activeRuns.set(sessionId, run);

  try {
    for await (const event of run.stream()) {
      const result = dispatchCursorStreamEvent(event, callbacks);
      if (result === "abort") return;
    }

    if (run.status === "cancelled") {
      callbacks.onCancel();
      return;
    }

    if (run.status === "error") {
      callbacks.onError(run.result ?? "Cursor run failed.");
      return;
    }

    // If the stream produced no assistant text but the run carries a final
    // result, surface it so the user isn't staring at an empty bubble.
    if (typeof run.result === "string" && run.result.length > 0) {
      callbacks.onTextDelta(""); // no-op delta to ensure a text part exists
    }

    callbacks.onFinish();
  } catch (error) {
    callbacks.onError(toCursorRunErrorMessage(error));
  } finally {
    if (activeRuns.get(sessionId) === run) {
      activeRuns.delete(sessionId);
    }
  }
}

export async function cancelCursorRun(sessionId: string): Promise<void> {
  const run = activeRuns.get(sessionId);
  if (!run) return;
  try {
    await run.cancel();
  } catch {
    // ignore; the stream loop will exit on its own
  }
}

export async function disposeCursorAgent(sessionId: string): Promise<void> {
  const entry = sessions.get(sessionId);
  if (!entry) return;
  sessions.delete(sessionId);
  await cancelCursorRun(sessionId);
  try {
    entry.agent.close();
  } catch {
    // best-effort
  }
}

export async function disposeAllCursorAgents(): Promise<void> {
  const ids = [...sessions.keys()];
  await Promise.all(ids.map((id) => disposeCursorAgent(id)));
}
