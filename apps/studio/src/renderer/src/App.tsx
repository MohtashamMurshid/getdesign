import { AuthLanding } from "@/components/auth-landing";
import { ChatSidebar } from "@/components/studio/chat-sidebar";
import { StudioLoadingScreen } from "@/components/studio/studio-loading-screen";
import { DeckWorkspace } from "@/components/deck-workspace";
import { SettingsPage } from "@/components/settings-page";
import { useStudioAppState } from "@/hooks/use-studio-app-state";

export default function App() {
  const studio = useStudioAppState();
  const {
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
    constants,
  } = studio;

  if (!authLoaded) {
    return <StudioLoadingScreen />;
  }

  if (!isAuthed || previewAuth) {
    return (
      <AuthLanding
        previewMode={previewAuth}
        onExitPreview={() => setPreviewAuth(false)}
        error={error}
        oauthProviderCards={oauthProviderCards}
        authStatus={authStatus}
        manualCode={manualCode}
        setManualCode={setManualCode}
        onSubmitLoginCode={handleSubmitLoginCode}
        onStartLogin={handleStartLogin}
        provider={provider}
        setProvider={setProvider}
        providers={constants.byokProviderOptions}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onRuntimeKey={handleRuntimeKey}
        onAddCustomProvider={handleAddCustomProvider}
        customProviderApiOptions={constants.customProviderApiOptions}
        onRefresh={refresh}
      />
    );
  }

  if (view === "settings") {
    return (
      <SettingsPage
        models={models}
        visibleModelIds={visibleModelIds}
        setVisibleModelIds={setVisibleModelIds}
        authStatus={authStatus}
        oauthProviderCards={oauthProviderCards}
        onStartLogin={handleStartLogin}
        onDisconnectProvider={handleDisconnectProvider}
        onLogoutAll={handleLogoutAll}
        onPreviewAuth={() => {
          setPreviewAuth(true);
          setView("chat");
        }}
        onAddCustomProvider={handleAddCustomProvider}
        onAddCustomModel={handleAddCustomModel}
        onRemoveCustomModel={handleRemoveCustomModel}
        customProviderApiOptions={constants.customProviderApiOptions}
        provider={provider}
        setProvider={setProvider}
        providers={constants.byokProviderOptions}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onRuntimeKey={handleRuntimeKey}
        onBack={() => setView("chat")}
        onRefresh={refresh}
        error={error}
      />
    );
  }

  return (
    <main className="flex h-full overflow-hidden bg-background text-foreground">
      {isChatOpen ? (
        <ChatSidebar
          conversation={conversation}
          chatSessions={chatSessions}
          authStatus={authStatus}
          error={error}
          displayedModels={displayedModels}
          selectedModelId={selectedModelId}
          onCollapse={() => setIsChatOpen(false)}
          onRefresh={refresh}
          onNewChat={handleNewChat}
          onOpenSettings={() => setView("settings")}
          onModelChange={handleModelChange}
          onSend={handleSend}
          onStop={handleStop}
          onOpenChatSession={handleOpenChatSession}
          onRenameChatSession={handleRenameChatSession}
          onDeleteChatSession={handleDeleteChatSession}
        />
      ) : null}
      <DeckWorkspace
        decks={decks}
        selectedDeckId={selectedDeckId}
        status={conversation.status}
        showChatToggle={!isChatOpen}
        onShowChat={() => setIsChatOpen(true)}
        onSelectDeck={setUserSelectedDeckId}
        onOpenDeck={handleOpenDeck}
        onRevealPath={window.api.revealPath}
        onExportDeck={handleExportDeck}
      />
    </main>
  );
}
