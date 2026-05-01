import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  StudioCursorAccount,
  StudioCursorAuthStatus,
  StudioCursorLoginInput,
  StudioCursorModel,
  StudioEvent,
} from "../shared/studio-api";

const CURSOR_DASHBOARD_URL = "https://cursor.com/dashboard/integrations";

let cursorWindow: BrowserWindow | undefined;
let cursorState: StudioCursorAuthStatus = { signedIn: false, status: "idle" };
let cachedApiKey: string | undefined;
let stateLoaded = false;
let saveLock: Promise<void> = Promise.resolve();

type StoredCursorAuth = {
  /** `cipher` is set when Electron safeStorage is available; otherwise `plain`. */
  cipher?: string;
  plain?: string;
  account?: StudioCursorAccount;
  models?: StudioCursorModel[];
};

export function registerCursorIpc(window: BrowserWindow): void {
  cursorWindow = window;

  ipcMain.handle("studio:cursor-get-auth", () => getCursorAuth());
  ipcMain.handle(
    "studio:cursor-login",
    (_event, input: StudioCursorLoginInput) => cursorLogin(input),
  );
  ipcMain.handle("studio:cursor-logout", () => cursorLogout());
  ipcMain.handle("studio:cursor-open-dashboard", () =>
    shell.openExternal(CURSOR_DASHBOARD_URL),
  );

  // Best-effort: hydrate any persisted credential on startup so the renderer
  // sees the signed-in state immediately when it boots.
  void hydrateOnStartup();
}

/** Returns the active Cursor API key for callers like agent-runners. */
export function getCursorApiKey(): string | undefined {
  return cachedApiKey;
}

/** Public read for renderer + status emits. */
export async function getCursorAuth(): Promise<StudioCursorAuthStatus> {
  await ensureLoaded();
  return cursorState;
}

async function cursorLogin(
  input: StudioCursorLoginInput,
): Promise<StudioCursorAuthStatus> {
  const apiKey = input.apiKey.trim();
  if (!apiKey) {
    throw new Error("Cursor API key is required.");
  }

  setState({ ...cursorState, status: "verifying", error: undefined });

  try {
    const account = await fetchCursorAccount(apiKey);
    const models = await fetchCursorModels(apiKey);
    cachedApiKey = apiKey;
    process.env.CURSOR_API_KEY = apiKey;
    await persistApiKey(apiKey, account, models);
    setState({
      signedIn: true,
      status: "ready",
      account,
      apiKeyHint: maskApiKey(apiKey),
      models,
    });
    return cursorState;
  } catch (error) {
    const message = describeCursorError(error);
    setState({
      ...cursorState,
      signedIn: cursorState.signedIn,
      status: "error",
      error: message,
    });
    throw new Error(message);
  }
}

function describeCursorError(error: unknown): string {
  if (!error) return "Unknown Cursor error.";
  const record = error as Record<string, unknown>;
  const name = typeof record["name"] === "string" ? (record["name"] as string) : undefined;
  const status =
    typeof record["status"] === "number" ? (record["status"] as number) : undefined;
  const code = typeof record["code"] === "string" ? (record["code"] as string) : undefined;
  const baseMessage =
    error instanceof Error && error.message && error.message !== "Error"
      ? error.message
      : undefined;

  if (name === "AuthenticationError" || status === 401) {
    return (
      "Cursor rejected this API key. Double-check it on cursor.com/dashboard/integrations and try again."
    );
  }
  if (name === "RateLimitError" || status === 429) {
    return "Cursor is rate-limiting requests right now. Wait a moment and retry.";
  }
  if (name === "NetworkError") {
    return "Could not reach Cursor. Check your connection and retry.";
  }
  if (baseMessage) return baseMessage;
  if (name && code) return `${name}: ${code}`;
  if (name) return name;
  return "Cursor login failed.";
}

async function cursorLogout(): Promise<StudioCursorAuthStatus> {
  cachedApiKey = undefined;
  delete process.env.CURSOR_API_KEY;
  await deletePersistedAuth();
  setState({ signedIn: false, status: "idle" });
  return cursorState;
}

async function fetchCursorAccount(apiKey: string): Promise<StudioCursorAccount> {
  // Lazy-load so failures importing the SDK don't break studio startup.
  let sdk: typeof import("@cursor/sdk");
  try {
    sdk = (await import("@cursor/sdk")) as typeof import("@cursor/sdk");
  } catch (importError) {
    const message =
      importError instanceof Error ? importError.message : String(importError);
    if (/bindings|node_sqlite3|MODULE_NOT_FOUND/i.test(message)) {
      throw new Error(
        "Cursor SDK native dependencies are not built for this Electron runtime. " +
          "Run `bun install` (or `npm rebuild`) inside apps/studio to compile the " +
          "SDK's native bindings, then restart Studio.",
      );
    }
    throw new Error(`Could not load @cursor/sdk: ${message}`);
  }

  const me = await sdk.Cursor.me({ apiKey });
  return {
    apiKeyName: me.apiKeyName,
    userEmail: me.userEmail,
    userFirstName: me.userFirstName,
    userLastName: me.userLastName,
    userId: me.userId,
    createdAt: me.createdAt,
  };
}

async function fetchCursorModels(apiKey: string): Promise<StudioCursorModel[]> {
  try {
    const sdk = (await import("@cursor/sdk")) as typeof import("@cursor/sdk");
    const items = await sdk.Cursor.models.list({ apiKey });
    return (items ?? []).map((item) => ({
      id: item.id,
      displayName: item.displayName,
      description: item.description,
    }));
  } catch {
    // Don't fail login if the catalog fetch hiccups; the renderer will show an
    // empty list and the user can refresh from settings.
    return [];
  }
}

function maskApiKey(apiKey: string): string {
  const tail = apiKey.slice(-4);
  return `cursor_***${tail}`;
}

function setState(next: StudioCursorAuthStatus): void {
  cursorState = next;
  emit({ type: "cursor-auth", payload: cursorState });
}

function emit(event: StudioEvent): void {
  cursorWindow?.webContents.send("studio:event", event);
}

/* --------------------------------------------------------------------- */
/* Persistence                                                            */
/* --------------------------------------------------------------------- */

function getCursorAuthPath(): string {
  return join(app.getPath("userData"), "cursor-auth.json");
}

async function ensureLoaded(): Promise<void> {
  if (stateLoaded) return;
  stateLoaded = true;

  const path = getCursorAuthPath();
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    return;
  }

  let parsed: StoredCursorAuth | undefined;
  try {
    parsed = JSON.parse(raw) as StoredCursorAuth;
  } catch {
    return;
  }
  if (!parsed) return;

  const apiKey = decodeStoredKey(parsed);
  if (!apiKey) return;

  cachedApiKey = apiKey;
  process.env.CURSOR_API_KEY = apiKey;
  cursorState = {
    signedIn: true,
    status: "ready",
    account: parsed.account,
    apiKeyHint: maskApiKey(apiKey),
    models: parsed.models,
  };
}

async function hydrateOnStartup(): Promise<void> {
  await ensureLoaded();
  if (!cachedApiKey) return;

  // Best-effort revalidation in the background. Failures don't sign the user
  // out; they just surface a warning so they can recover. Network-flakiness
  // shouldn't kick someone out of the app.
  try {
    const account = await fetchCursorAccount(cachedApiKey);
    const models = await fetchCursorModels(cachedApiKey);
    setState({
      signedIn: true,
      status: "ready",
      account,
      apiKeyHint: maskApiKey(cachedApiKey),
      models,
    });
    await persistApiKey(cachedApiKey, account, models);
  } catch (error) {
    setState({
      ...cursorState,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function persistApiKey(
  apiKey: string,
  account?: StudioCursorAccount,
  models?: StudioCursorModel[],
): Promise<void> {
  saveLock = saveLock.then(async () => {
    const path = getCursorAuthPath();
    await mkdir(app.getPath("userData"), { recursive: true });
    const payload = encodeStoredKey(apiKey, account, models);
    await writeFile(path, JSON.stringify(payload, null, 2), { encoding: "utf8", mode: 0o600 });
  });
  await saveLock;
}

async function deletePersistedAuth(): Promise<void> {
  saveLock = saveLock.then(async () => {
    const path = getCursorAuthPath();
    try {
      await rm(path, { force: true });
    } catch {
      // ignore
    }
  });
  await saveLock;
}

function encodeStoredKey(
  apiKey: string,
  account: StudioCursorAccount | undefined,
  models: StudioCursorModel[] | undefined,
): StoredCursorAuth {
  if (safeStorage.isEncryptionAvailable()) {
    const cipher = safeStorage.encryptString(apiKey).toString("base64");
    return { cipher, account, models };
  }
  // Fall back to plaintext on platforms / configurations where Electron
  // safeStorage isn't available (e.g. Linux without an org keyring). The
  // file is written 0o600 so other users on the system can't read it.
  return { plain: apiKey, account, models };
}

function decodeStoredKey(stored: StoredCursorAuth): string | undefined {
  if (stored.cipher) {
    try {
      const buffer = Buffer.from(stored.cipher, "base64");
      if (!safeStorage.isEncryptionAvailable()) return undefined;
      return safeStorage.decryptString(buffer);
    } catch {
      return undefined;
    }
  }
  if (stored.plain) return stored.plain;
  return undefined;
}
