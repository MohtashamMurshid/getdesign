import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  StudioAddCustomProviderInput,
  StudioCustomModelRow,
  StudioRemoveCustomModelInput,
} from "../shared/studio-api";

type JsonProvider = {
  baseUrl?: string;
  api?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  authHeader?: boolean;
  compat?: unknown;
  models?: Array<{ id: string; name?: string }>;
  modelOverrides?: Record<string, unknown>;
};

export type ModelsJsonRoot = {
  providers: Record<string, JsonProvider>;
};

export function readModelsJson(modelsPath: string):
  | { ok: true; data: ModelsJsonRoot }
  | { ok: false; error: string } {
  if (!existsSync(modelsPath)) {
    return { ok: true, data: { providers: {} } };
  }
  try {
    const raw = readFileSync(modelsPath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "models.json must be a JSON object." };
    }
    const providers = (parsed as Record<string, unknown>)["providers"];
    if (providers === undefined) {
      return { ok: true, data: { providers: {} } };
    }
    if (!providers || typeof providers !== "object" || Array.isArray(providers)) {
      return { ok: false, error: 'models.json "providers" must be an object.' };
    }
    return { ok: true, data: { providers: providers as Record<string, JsonProvider> } };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function writeModelsJson(modelsPath: string, data: ModelsJsonRoot): void {
  const dir = dirname(modelsPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  writeFileSync(modelsPath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  chmodSync(modelsPath, 0o600);
}

export function listCustomModelRows(data: ModelsJsonRoot): StudioCustomModelRow[] {
  const rows: StudioCustomModelRow[] = [];
  for (const [providerId, prov] of Object.entries(data.providers ?? {})) {
    for (const m of prov.models ?? []) {
      if (!m?.id || typeof m.id !== "string") continue;
      rows.push({
        providerId,
        modelId: m.id,
        name: typeof m.name === "string" ? m.name : undefined,
        fullId: `${providerId}/${m.id}`,
      });
    }
  }
  return rows.sort((a, b) => a.fullId.localeCompare(b.fullId));
}

export function addCustomProviderEntry(
  data: ModelsJsonRoot,
  input: StudioAddCustomProviderInput,
): ModelsJsonRoot {
  const providerId = input.providerId.trim();
  const baseUrl = input.baseUrl.trim();
  const apiKey = input.apiKey.trim();
  const modelId = input.modelId.trim();
  if (!providerId || !baseUrl || !apiKey || !modelId) {
    throw new Error("Provider id, base URL, API key, and model id are required.");
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(providerId)) {
    throw new Error(
      "Provider id must start with a letter or number and contain only letters, numbers, dots, underscores, or hyphens.",
    );
  }

  const providers = { ...data.providers };
  const existing = providers[providerId];
  const modelEntry: { id: string; name?: string } = { id: modelId };
  const modelName = input.modelName?.trim();
  if (modelName) modelEntry.name = modelName;

  const existingModels = existing?.models ?? [];
  if (existingModels.some((m) => m.id === modelId)) {
    throw new Error(`Model "${modelId}" already exists for provider "${providerId}".`);
  }

  const nextModels = [...existingModels, modelEntry];

  if (existing) {
    providers[providerId] = {
      ...existing,
      baseUrl,
      api: input.api,
      apiKey,
      models: nextModels,
    };
  } else {
    providers[providerId] = {
      baseUrl,
      api: input.api,
      apiKey,
      models: nextModels,
    };
  }

  return { providers };
}

export function removeCustomModelEntry(
  data: ModelsJsonRoot,
  input: StudioRemoveCustomModelInput,
): ModelsJsonRoot {
  const providerId = input.providerId.trim();
  const modelId = input.modelId.trim();
  if (!providerId || !modelId) {
    throw new Error("Provider id and model id are required.");
  }

  const providers = { ...data.providers };
  const prov = providers[providerId];
  if (!prov?.models?.length) {
    throw new Error(`No models listed for provider "${providerId}" in models.json.`);
  }

  const nextModels = prov.models.filter((m) => m.id !== modelId);
  if (nextModels.length === prov.models.length) {
    throw new Error(`Model "${modelId}" was not found under provider "${providerId}".`);
  }

  if (nextModels.length === 0) {
    const { models: _m, ...rest } = prov;
    if (Object.keys(rest).length === 0) {
      delete providers[providerId];
    } else {
      providers[providerId] = rest;
    }
  } else {
    providers[providerId] = { ...prov, models: nextModels };
  }

  return { providers };
}
