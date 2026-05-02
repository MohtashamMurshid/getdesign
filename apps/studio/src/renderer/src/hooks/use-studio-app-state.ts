import { useCallback, useEffect, useMemo, useState } from "react";
import { toErrorMessage } from "@/lib/to-error-message";
import {
  buildStudioModelOptions,
  getCursorAuthError,
  getDisplayedModels,
  getPreferredModelId,
  getSelectedDeckId,
  isCursorModel,
  readVisibleModelIds,
  sanitizeConversation,
  writeVisibleModelIds,
} from "@/hooks/studio-app-state-helpers";
import {
  BYOK_PROVIDER_OPTIONS,
  CUSTOM_PROVIDER_API_OPTIONS,
} from "@/studio/constants";
import { buildOauthProviderCards } from "@/studio/oauth-cards";

import type {
  StudioAddCustomProviderInput,
  StudioAuthStatus,
  StudioChatSessionSummary,
  StudioConversationSnapshot,
  StudioCursorAuthStatus,
  StudioDeckExportFormat,
  StudioDeckProject,
} from "../../../shared/studio-api";

export type StudioView = "chat" | "settings";

export function useStudioAppState() {
  const [view, setView] = useState<StudioView>("chat");
  const [authStatus, setAuthStatus] = useState<StudioAuthStatus | undefined>();
  const [authLoaded, setAuthLoaded] = useState(false);
  const [previewAuth, setPreviewAuth] = useState(false);
  const [conversation, setConversation] = useState<StudioConversationSnapshot>({
    status: "ready",
    messages: [],
  });
  const [chatSessions, setChatSessions] = useState<StudioChatSessionSummary[]>(
    [],
  );
  const [decks, setDecks] = useState<StudioDeckProject[]>([]);
  const [userSelectedDeckId, setUserSelectedDeckId] = useState<
    string | undefined
  >();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [cursorAuth, setCursorAuth] = useState<StudioCursorAuthStatus>({
    signedIn: false,
    status: "idle",
  });
  const [cursorApiKeyDraft, setCursorApiKeyDraft] = useState("");
  const [cursorBusy, setCursorBusy] = useState(false);
  const [cursorError, setCursorError] = useState<string | undefined>();
  const [visibleModelIds, setVisibleModelIds] = useState<string[]>(
    readVisibleModelIds,
  );

  const oauthProviderCards = useMemo(
    () => buildOauthProviderCards(authStatus?.oauthProviders),
    [authStatus?.oauthProviders],
  );

  const refresh = useCallback(async () => {
    try {
      setError(undefined);
      const [nextAuth, nextConversation, nextCursorAuth] = await Promise.all([
        window.api.getAuthStatus(),
        window.api.getConversation(),
        window.api.getCursorAuth(),
      ]);
      const [nextDecks, nextSessions] = await Promise.all([
        window.api.listDecks(),
        window.api.listChatSessions(),
      ]);
      setAuthStatus(nextAuth);
      setAuthLoaded(true);
      setConversation(sanitizeConversation(nextConversation));
      setDecks(nextDecks);
      setChatSessions(nextSessions);
      setUserSelectedDeckId(undefined);
      setSelectedModelId((current) => current || nextAuth.selectedModelId || "");
      setCursorAuth(nextCursorAuth);
      setCursorError(getCursorAuthError(nextCursorAuth));
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = window.api.onStudioEvent((event) => {
      switch (event.type) {
        case "auth":
          setAuthStatus(event.payload);
          setAuthLoaded(true);
          setSelectedModelId(
            (current) => current || event.payload.selectedModelId || "",
          );
          break;
        case "conversation": {
          const sanitized = sanitizeConversation(event.payload);
          setConversation(sanitized);
          setError(sanitized.error);
          break;
        }
        case "decks":
          setDecks(event.payload);
          setUserSelectedDeckId((current) =>
            current && event.payload.some((deck) => deck.id === current)
              ? current
              : undefined,
          );
          break;
        case "sessions":
          setChatSessions(event.payload);
          break;
        case "cursor-auth":
          setCursorAuth(event.payload);
          setCursorError(getCursorAuthError(event.payload));
          break;
      }
    });

    void refresh();
    return unsubscribe;
  }, [refresh]);

  const models = useMemo(
    () => buildStudioModelOptions(authStatus, cursorAuth),
    [authStatus, cursorAuth],
  );

  const displayedModels = useMemo(
    () => getDisplayedModels(models, visibleModelIds),
    [models, visibleModelIds],
  );

  const isAuthed =
    Boolean(authStatus?.hasAvailableModels) ||
    (cursorAuth.signedIn && (cursorAuth.models?.length ?? 0) > 0);

  const selectedDeckId = useMemo(
    () =>
      getSelectedDeckId({
        decks,
        currentArtifactId: conversation.currentArtifactId,
        userSelectedDeckId,
      }),
    [decks, conversation.currentArtifactId, userSelectedDeckId],
  );

  useEffect(() => {
    writeVisibleModelIds(visibleModelIds);
  }, [visibleModelIds]);

  useEffect(() => {
    const syncRuntime = (id: string) => {
      if (isCursorModel(id)) return;
      void window.api.selectModel({ modelId: id });
    };
    if (!selectedModelId && displayedModels[0]) {
      setSelectedModelId(displayedModels[0].id);
      syncRuntime(displayedModels[0].id);
    }
    if (selectedModelId && displayedModels.length > 0) {
      const isVisible = displayedModels.some(
        (model) => model.id === selectedModelId,
      );
      if (!isVisible) {
        setSelectedModelId(displayedModels[0].id);
        syncRuntime(displayedModels[0].id);
      }
    }
  }, [displayedModels, selectedModelId]);

  const handleLogoutAll = useCallback(async () => {
    const ok = window.confirm(
      "Sign out of all providers? This clears OAuth tokens and runtime API keys for every connected provider.",
    );
    if (!ok) return;
    try {
      setError(undefined);
      const nextAuth = await window.api.logoutAll();
      setAuthStatus(nextAuth);
      setSelectedModelId("");
      setView("chat");
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, []);

  const handleRuntimeKey = useCallback(async () => {
    try {
      setError(undefined);
      const nextAuth = await window.api.setRuntimeApiKey({ provider, apiKey });
      setAuthStatus(nextAuth);
      setApiKey("");
      setSelectedModelId(getPreferredModelId(nextAuth));
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, [provider, apiKey]);

  const handleSubmitLoginCode = useCallback(async () => {
    try {
      setError(undefined);
      const nextAuth = await window.api.submitLoginCode({ code: manualCode });
      setAuthStatus(nextAuth);
      setManualCode("");
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, [manualCode]);

  const handleStartLogin = useCallback(async (providerId: string) => {
    try {
      setError(undefined);
      const nextAuth = await window.api.startLogin({ providerId });
      setAuthStatus(nextAuth);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, []);

  const handleDisconnectProvider = useCallback(
    async (providerId: string) => {
      const label =
        oauthProviderCards.find((p) => p.id === providerId)?.name ??
        providerId;
      const ok = window.confirm(
        `Disconnect ${label}? This removes that provider from Pi auth storage (same as the /logout command in Pi) and clears any runtime API key Studio set for it. Models that only relied on those credentials will disappear.`,
      );
      if (!ok) return;
      try {
        setError(undefined);
        const nextAuth = await window.api.disconnectProvider({ providerId });
        setAuthStatus(nextAuth);
        setSelectedModelId(getPreferredModelId(nextAuth));
      } catch (nextError) {
        setError(toErrorMessage(nextError));
      }
    },
    [oauthProviderCards],
  );

  const handleAddCustomProvider = useCallback(
    async (input: StudioAddCustomProviderInput) => {
      try {
        setError(undefined);
        const nextAuth = await window.api.addCustomProvider(input);
        setAuthStatus(nextAuth);
        setSelectedModelId(getPreferredModelId(nextAuth));
      } catch (nextError) {
        setError(toErrorMessage(nextError));
        throw nextError;
      }
    },
    [],
  );

  const handleAddCustomModel = useCallback(
    async (input: {
      providerId: string;
      modelId: string;
      modelName?: string;
    }) => {
      try {
        setError(undefined);
        const nextAuth = await window.api.addCustomModel(input);
        setAuthStatus(nextAuth);
      } catch (nextError) {
        setError(toErrorMessage(nextError));
        throw nextError;
      }
    },
    [],
  );

  const handleRemoveCustomModel = useCallback(
    async (providerId: string, modelId: string) => {
      const ok = window.confirm(
        `Remove "${providerId}/${modelId}" from models.json? This cannot be undone.`,
      );
      if (!ok) return;
      try {
        setError(undefined);
        const nextAuth = await window.api.removeCustomModel({
          providerId,
          modelId,
        });
        setAuthStatus(nextAuth);
        setSelectedModelId(getPreferredModelId(nextAuth));
      } catch (nextError) {
        setError(toErrorMessage(nextError));
        throw nextError;
      }
    },
    [],
  );

  const handleModelChange = useCallback(async (modelId: string) => {
    try {
      setError(undefined);
      setSelectedModelId(modelId);
      // Cursor models live outside the Pi model registry; selecting them in
      // the Pi runtime would throw. The renderer just tracks the selection
      // locally until Cursor-side inference is wired up.
      if (isCursorModel(modelId)) {
        setConversation((current) =>
          current.error ? { ...current, error: undefined } : current,
        );
        return;
      }
      const nextAuth = await window.api.selectModel({ modelId });
      setAuthStatus(nextAuth);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, []);

  const handleSend = useCallback(
    async (message: { content: string }) => {
      if (!message.content.trim()) return;
      try {
        setError(undefined);
        const nextConversation = await window.api.sendPrompt({
          content: message.content,
          modelId: selectedModelId || undefined,
        });
        setConversation(sanitizeConversation(nextConversation));
      } catch (nextError) {
        setError(toErrorMessage(nextError));
      }
    },
    [selectedModelId],
  );

  const handleStop = useCallback(async () => {
    try {
      const nextConversation = sanitizeConversation(await window.api.stop());
      setConversation(nextConversation);
      setError(nextConversation.error);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      setError(undefined);
      const next = await window.api.newConversation();
      const nextDecks = await window.api.listDecks();
      setConversation(sanitizeConversation(next));
      setDecks(nextDecks);
      setUserSelectedDeckId(undefined);
      setIsChatOpen(true);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, []);

  const handleRenameChatSession = useCallback(
    async (sessionId: string, title: string) => {
      try {
        setError(undefined);
        const next = await window.api.renameChatSession({ sessionId, title });
        setChatSessions(next);
      } catch (nextError) {
        setError(toErrorMessage(nextError));
      }
    },
    [],
  );

  const handleDeleteChatSession = useCallback(async (sessionId: string) => {
    try {
      setError(undefined);
      const next = await window.api.deleteChatSession({ sessionId });
      setConversation(sanitizeConversation(next));
      const [nextSessions, nextDecks] = await Promise.all([
        window.api.listChatSessions(),
        window.api.listDecks(),
      ]);
      setChatSessions(nextSessions);
      setDecks(nextDecks);
      setUserSelectedDeckId(undefined);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
    }
  }, []);

  const handleOpenChatSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === conversation.id) return;
      try {
        setError(undefined);
        const nextConversation = await window.api.openChatSession(sessionId);
        const nextDecks = await window.api.listDecks();
        setConversation(sanitizeConversation(nextConversation));
        setDecks(nextDecks);
        setUserSelectedDeckId(undefined);
        setIsChatOpen(true);
      } catch (nextError) {
        setError(toErrorMessage(nextError));
      }
    },
    [conversation.id],
  );

  const handleOpenDeck = useCallback(async (deckId: string) => {
    try {
      setError(undefined);
      await window.api.openDeck(deckId);
    } catch (nextError) {
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }, []);

  const handleExportDeck = useCallback(
    async (deckId: string, format: StudioDeckExportFormat) => {
      try {
        setError(undefined);
        return await window.api.exportDeck({ deckId, format });
      } catch (nextError) {
        setError(toErrorMessage(nextError));
        throw nextError;
      }
    },
    [],
  );

  const handleCursorLogin = useCallback(async () => {
    const trimmed = cursorApiKeyDraft.trim();
    if (!trimmed) return;
    setCursorBusy(true);
    setCursorError(undefined);
    try {
      const next = await window.api.cursorLogin({ apiKey: trimmed });
      setCursorAuth(next);
      setCursorApiKeyDraft("");
    } catch (nextError) {
      setCursorError(toErrorMessage(nextError));
    } finally {
      setCursorBusy(false);
    }
  }, [cursorApiKeyDraft]);

  const handleCursorLogout = useCallback(async () => {
    const ok = window.confirm(
      "Sign out of Cursor? Your stored API key will be removed from this device.",
    );
    if (!ok) return;
    setCursorBusy(true);
    setCursorError(undefined);
    try {
      const next = await window.api.cursorLogout();
      setCursorAuth(next);
    } catch (nextError) {
      setCursorError(toErrorMessage(nextError));
    } finally {
      setCursorBusy(false);
    }
  }, []);

  const handleOpenCursorDashboard = useCallback(async () => {
    try {
      await window.api.openCursorDashboard();
    } catch (nextError) {
      setCursorError(toErrorMessage(nextError));
    }
  }, []);

  return {
    view,
    setView,
    authStatus,
    authLoaded,
    previewAuth,
    setPreviewAuth,
    conversation,
    chatSessions,
    decks,
    userSelectedDeckId,
    setUserSelectedDeckId,
    isChatOpen,
    setIsChatOpen,
    selectedModelId,
    provider,
    setProvider,
    apiKey,
    setApiKey,
    manualCode,
    setManualCode,
    error,
    visibleModelIds,
    setVisibleModelIds,
    oauthProviderCards,
    models,
    displayedModels,
    isAuthed,
    selectedDeckId,
    refresh,
    handleLogoutAll,
    handleRuntimeKey,
    handleSubmitLoginCode,
    handleStartLogin,
    handleDisconnectProvider,
    handleAddCustomProvider,
    handleAddCustomModel,
    handleRemoveCustomModel,
    handleModelChange,
    handleSend,
    handleStop,
    handleNewChat,
    handleRenameChatSession,
    handleDeleteChatSession,
    handleOpenChatSession,
    handleOpenDeck,
    handleExportDeck,
    cursorAuth,
    cursorApiKeyDraft,
    setCursorApiKeyDraft,
    cursorBusy,
    cursorError,
    handleCursorLogin,
    handleCursorLogout,
    handleOpenCursorDashboard,
    constants: {
      byokProviderOptions: BYOK_PROVIDER_OPTIONS,
      customProviderApiOptions: CUSTOM_PROVIDER_API_OPTIONS,
    },
  } as const;
}

export type StudioAppState = ReturnType<typeof useStudioAppState>;
