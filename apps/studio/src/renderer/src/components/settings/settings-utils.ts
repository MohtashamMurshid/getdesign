import type { SettingsModelRow } from "./settings-types";

export function buildModelsByProviderId(
  models: SettingsModelRow[],
): Map<string, SettingsModelRow[]> {
  const buckets = new Map<string, SettingsModelRow[]>();
  for (const model of models) {
    const key = model.provider ?? "unknown";
    const list = buckets.get(key);
    if (list) list.push(model);
    else buckets.set(key, [model]);
  }
  return buckets;
}

export function modelsForProvider(
  modelsByProviderId: Map<string, SettingsModelRow[]>,
  providerId: string,
): SettingsModelRow[] {
  const exact = modelsByProviderId.get(providerId);
  if (exact && exact.length > 0) return exact;
  const out: SettingsModelRow[] = [];
  for (const [key, list] of modelsByProviderId.entries()) {
    if (
      key === providerId ||
      key.includes(providerId) ||
      providerId.includes(key)
    ) {
      out.push(...list);
    }
  }
  return out;
}
