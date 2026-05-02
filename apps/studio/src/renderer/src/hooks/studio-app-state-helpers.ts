import { formatProviderDisplayName } from "@/lib/format-provider-label";

import {
  CURSOR_MODEL_PREFIX,
  isCursorModelId,
} from "../../../shared/cursor-model-id";
import type {
  StudioAuthStatus,
  StudioConversationSnapshot,
  StudioCursorAuthStatus,
  StudioDeckProject,
} from "../../../shared/studio-api";

const VISIBLE_MODEL_IDS_STORAGE_KEY = "studio.visibleModelIds";
const STALE_PI_CURSOR_MODEL_ERROR = /Pi model not found: cursor\//i;

export type StudioModelOption = {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
};

export function readVisibleModelIds(): string[] {
  try {
    const raw = localStorage.getItem(VISIBLE_MODEL_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch (error) {
    console.warn(
      `[studio] Failed to read ${VISIBLE_MODEL_IDS_STORAGE_KEY} from localStorage`,
      error,
    );
    return [];
  }
}

export function writeVisibleModelIds(modelIds: string[]) {
  try {
    localStorage.setItem(
      VISIBLE_MODEL_IDS_STORAGE_KEY,
      JSON.stringify(modelIds),
    );
  } catch (error) {
    console.warn(
      `[studio] Failed to persist ${VISIBLE_MODEL_IDS_STORAGE_KEY} to localStorage`,
      error,
    );
  }
}

export function isCursorModel(modelId: string) {
  return isCursorModelId(modelId);
}

export function sanitizeConversation(
  conversation: StudioConversationSnapshot,
): StudioConversationSnapshot {
  if (
    conversation.error &&
    STALE_PI_CURSOR_MODEL_ERROR.test(conversation.error)
  ) {
    return { ...conversation, error: undefined };
  }

  return conversation;
}

export function getCursorAuthError(auth: StudioCursorAuthStatus) {
  return auth.status === "error" ? auth.error : undefined;
}

export function getPreferredModelId(auth: StudioAuthStatus) {
  return auth.selectedModelId ?? auth.availableModels[0]?.id ?? "";
}

export function buildStudioModelOptions(
  authStatus: StudioAuthStatus | undefined,
  cursorAuth: StudioCursorAuthStatus,
): StudioModelOption[] {
  const oauthProviders = authStatus?.oauthProviders;
  const piModels =
    authStatus?.availableModels.map((model) => ({
      id: model.id,
      name: model.label,
      provider: model.provider,
      providerLabel: formatProviderDisplayName(model.provider, oauthProviders),
    })) ?? [];

  const cursorModels = cursorAuth.signedIn
    ? (cursorAuth.models ?? []).map((model) => ({
        id: `${CURSOR_MODEL_PREFIX}${model.id}`,
        name: model.displayName || model.id,
        provider: "cursor",
        providerLabel: "Cursor",
      }))
    : [];

  return [...piModels, ...cursorModels];
}

export function getDisplayedModels(
  models: StudioModelOption[],
  visibleModelIds: string[],
) {
  if (models.length === 0) return [];
  if (visibleModelIds.length === 0) return models;

  const allowed = new Set(visibleModelIds);
  const filtered = models.filter((model) => allowed.has(model.id));
  return filtered.length > 0 ? filtered : models;
}

export function getSelectedDeckId({
  decks,
  currentArtifactId,
  userSelectedDeckId,
}: {
  decks: StudioDeckProject[];
  currentArtifactId: string | undefined;
  userSelectedDeckId: string | undefined;
}) {
  if (
    userSelectedDeckId &&
    decks.some((deck) => deck.id === userSelectedDeckId)
  ) {
    return userSelectedDeckId;
  }

  return decks.find((deck) => deck.id === currentArtifactId)?.id;
}
