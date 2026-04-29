import type { StudioModelInfo, StudioOAuthProviderInfo } from "../../shared/studio-api";

import type { PiRuntime } from "./types";

export function modelRegistryAsRuntime(
  modelRegistry: unknown,
): PiRuntime["modelRegistry"] {
  return modelRegistry as PiRuntime["modelRegistry"];
}

export function findModel(
  runtime: PiRuntime,
  provider: string,
  id: string,
): unknown {
  return runtime.modelRegistry.find?.(provider, id);
}

export function toModelInfo(model: unknown): StudioModelInfo {
  const record = model as Record<string, unknown>;
  const provider = String(record["provider"] ?? "unknown");
  const id = String(record["id"] ?? "unknown");
  const name = String(record["name"] ?? id);
  return {
    id: `${provider}/${id}`,
    provider,
    name,
    label: `${provider}/${name}`,
    contextWindow:
      typeof record["contextWindow"] === "number"
        ? record["contextWindow"]
        : undefined,
    maxTokens:
      typeof record["maxTokens"] === "number" ? record["maxTokens"] : undefined,
  };
}

export function getOAuthProviders(runtime: PiRuntime): StudioOAuthProviderInfo[] {
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

export function getModelKey(model: unknown): string | undefined {
  const record = model as Record<string, unknown>;
  const provider = record["provider"];
  const id = record["id"];
  if (typeof provider !== "string" || typeof id !== "string") return undefined;
  return `${provider}/${id}`;
}

export function splitModelId(modelId: string): [provider: string, id: string] {
  const [provider, ...rest] = modelId.split("/");
  if (!provider || rest.length === 0) {
    throw new Error(`Invalid model id: ${modelId}`);
  }
  return [provider, rest.join("/")];
}
