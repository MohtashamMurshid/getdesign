/**
 * Per-session Cursor SDK runtime for Studio.
 *
 * Studio's chat surface streams events into a shared `messages[]` array owned
 * by `pi-service.ts`. To keep that ownership intact, this module exposes
 * callback-driven helpers so pi-service can plug in its existing
 * `appendStreamingText` / `emitConversation` / persistence helpers without
 * having to leak module state.
 *
 * The Cursor SDK is loaded lazily so a missing/native-build failure of
 * `@cursor/sdk` doesn't crash the rest of Studio.
 */

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
      const message = error instanceof Error ? error.message : String(error);
      if (/bindings|node_sqlite3|MODULE_NOT_FOUND/i.test(message)) {
        throw new Error(
          "Cursor SDK native dependencies aren't built for this Electron " +
            "runtime. Run `bun install` (or `npm rebuild`) inside apps/studio " +
            "to compile the SDK's native bindings, then restart Studio.",
        );
      }
      throw new Error(`Could not load @cursor/sdk: ${message}`);
    }
  })();
  return sdkPromise;
}

function bareCursorModelId(modelId: string): string {
  return modelId.startsWith("cursor/") ? modelId.slice("cursor/".length) : modelId;
}

async function getOrCreateAgent(
  sessionId: string,
  modelId: string,
  cwd: string,
  apiKey: string,
): Promise<SDKAgent> {
  const existing = sessions.get(sessionId);
  if (existing && existing.modelId === modelId && existing.cwd === cwd) {
    return existing.agent;
  }

  if (existing) {
    // Model or workspace changed — dispose the old agent before starting a new one.
    await disposeCursorAgent(sessionId);
  }

  const sdk = await getSdk();
  const agent = await sdk.Agent.create({
    apiKey,
    model: { id: bareCursorModelId(modelId) },
    local: { cwd },
  });
  sessions.set(sessionId, { agent, modelId, cwd });
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
    callbacks.onError(toCursorErrorMessage(error));
    return;
  }

  activeRuns.set(sessionId, run);

  try {
    for await (const event of run.stream()) {
      switch (event.type) {
        case "assistant": {
          const blocks = event.message?.content ?? [];
          for (const block of blocks) {
            if (block.type === "text" && typeof block.text === "string") {
              callbacks.onTextDelta(block.text);
            }
          }
          break;
        }
        case "thinking": {
          if (typeof event.text === "string" && event.text) {
            callbacks.onThinkingDelta(event.text);
          }
          break;
        }
        // Tool calls, status, task, request — surface as plain text hints so
        // the user sees something rather than nothing. We can render them
        // structurally later.
        case "tool_call": {
          if (event.status === "running" && typeof event.name === "string") {
            callbacks.onTextDelta(`\n\n_Running tool: \`${event.name}\`_\n`);
          }
          break;
        }
        case "status": {
          if (event.status === "ERROR" && typeof event.message === "string") {
            callbacks.onError(event.message);
            return;
          }
          break;
        }
        default:
          break;
      }
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
    callbacks.onError(toCursorErrorMessage(error));
  } finally {
    if (activeRuns.get(sessionId) === run) {
      activeRuns.delete(sessionId);
    }
    void apiKey; // silence unused-after-create lint when we cache the agent
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

function toCursorErrorMessage(error: unknown): string {
  if (!error) return "Unknown Cursor error.";
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
