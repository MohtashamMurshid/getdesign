import { app } from "electron";
import { join } from "node:path";

import { PI_PROVIDER_ENV_KEYS } from "./constants";

/** Studio-specific Pi agent config dir. Do not read the user's global `~/.pi/agent` config. */
export function getPiAgentDir(): string {
  return join(app.getPath("userData"), "pi-agent");
}

export function stripPiProviderEnvironment(): void {
  for (const key of PI_PROVIDER_ENV_KEYS) {
    delete process.env[key];
  }
}

export function getModelsJsonPath(): string {
  return join(getPiAgentDir(), "models.json");
}

export function getChatSessionsPath(): string {
  return join(getPiAgentDir(), "chat-sessions.json");
}
