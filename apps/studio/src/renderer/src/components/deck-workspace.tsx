import { useMemo, useState } from "react";
import {
  IconChevronRight,
  IconExternalLink,
  IconFileExport,
  IconFileTypePdf,
  IconFileTypePpt,
  IconLayoutSidebarLeftExpand,
  IconLayoutBoard,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
} from "./ui/card";

import type {
  StudioDeckExportFormat,
  StudioDeckProject,
  StudioExportDeckResult,
} from "../../../shared/studio-api";

type DeckWorkspaceProps = {
  decks: StudioDeckProject[];
  selectedDeckId?: string;
  status: "ready" | "submitted" | "streaming" | "error";
  showChatToggle?: boolean;
  onShowChat?: () => void;
  onSelectDeck: (deckId: string) => void;
  onOpenDeck: (deckId: string) => Promise<void>;
  onRevealPath: (path: string) => Promise<void>;
  onExportDeck: (
    deckId: string,
    format: StudioDeckExportFormat,
  ) => Promise<StudioExportDeckResult>;
};

export function DeckWorkspace({
  decks,
  selectedDeckId,
  status,
  showChatToggle = false,
  onShowChat,
  onSelectDeck,
  onOpenDeck,
  onRevealPath,
  onExportDeck,
}: DeckWorkspaceProps) {
  const [exportMessage, setExportMessage] = useState<string | undefined>();
  const [exportPath, setExportPath] = useState<string | undefined>();
  const [exportError, setExportError] = useState<string | undefined>();
  const [exportingFormat, setExportingFormat] = useState<StudioDeckExportFormat | undefined>();
  const [previewKey, setPreviewKey] = useState(0);
  const [previewError, setPreviewError] = useState<string | undefined>();

  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId),
    [decks, selectedDeckId],
  );
  const selectedDeckFolderName = selectedDeck
    ? selectedDeck.path.split("/").filter(Boolean).slice(-1)[0]
    : undefined;
  const previewSrc = selectedDeck
    ? `${selectedDeck.previewUrl}?v=${selectedDeck.updatedAt}-${previewKey}`
    : undefined;

  async function handleExport(format: StudioDeckExportFormat) {
    if (!selectedDeck) return;
    setExportingFormat(format);
    setExportError(undefined);
    setExportMessage(undefined);
    setExportPath(undefined);
    try {
      const result = await onExportDeck(selectedDeck.id, format);
      setExportMessage(result.message);
      setExportPath(result.path);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExportingFormat(undefined);
    }
  }

  return (
    <aside className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {showChatToggle && onShowChat ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onShowChat}
              aria-label="Show chat"
              title="Show chat"
            >
              <IconLayoutSidebarLeftExpand size={16} />
            </Button>
          ) : null}
          <span className="rounded border border-border bg-muted/40 px-2 py-1 text-xs font-medium">
            Design Files
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setPreviewError(undefined);
              setPreviewKey((key) => key + 1);
            }}
            aria-label="Reload artifact"
            title="Reload artifact"
          >
            <IconRefresh size={14} />
          </Button>
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">project</span>
            {selectedDeck ? (
              <>
                <IconChevronRight size={13} />
                <span className="truncate" title={selectedDeck.path}>
                  {selectedDeckFolderName}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {selectedDeck ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenDeck(selectedDeck.id)}
            >
              <IconExternalLink size={14} />
              Folder
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        {selectedDeck ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-normal">
                  {selectedDeck.title}
                </h3>
                <p className="text-xs font-light text-muted-foreground">
                  {selectedDeck.slides.length} slides · {selectedDeck.mode}
                </p>
                <p className="mt-1 max-w-xl text-xs font-light text-muted-foreground">
                  HTML is the source deck. PDF preserves the visual snapshot.
                  Editable PPTX requires `pptx-safe` HTML.
                </p>
              </div>
            </div>

            {decks.length > 1 ? (
              <select
                value={selectedDeck.id}
                onChange={(event) => {
                  setPreviewError(undefined);
                  onSelectDeck(event.target.value);
                }}
                className="mb-3 h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-ring"
                aria-label="Select previous generation"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.title}
                  </option>
                ))}
              </select>
            ) : null}

            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border/80 bg-black">
              <iframe
                key={`${selectedDeck.id}-${selectedDeck.updatedAt}-${previewKey}`}
                title={`${selectedDeck.title} preview`}
                src={previewSrc}
                onLoad={() => setPreviewError(undefined)}
                onError={() => setPreviewError("Preview failed to load.")}
                className="h-full w-full border-0 bg-black"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                disabled={Boolean(exportingFormat)}
                onClick={() => handleExport("html")}
              >
                <IconFileExport size={15} />
                {exportingFormat === "html" ? "Opening..." : "HTML"}
              </Button>
              <Button
                variant="secondary"
                disabled={Boolean(exportingFormat)}
                onClick={() => handleExport("pdf")}
              >
                <IconFileTypePdf size={15} />
                {exportingFormat === "pdf" ? "Exporting..." : "PDF"}
              </Button>
              <Button
                variant="secondary"
                disabled={Boolean(exportingFormat) || selectedDeck.mode !== "pptx-safe"}
                title={
                  selectedDeck.mode === "pptx-safe"
                    ? "Export editable PPTX"
                    : "Editable PPTX requires pptx-safe authoring"
                }
                onClick={() => handleExport("pptx")}
              >
                <IconFileTypePpt size={15} />
                {exportingFormat === "pptx" ? "Exporting..." : "PPTX"}
              </Button>
            </div>

            {exportMessage ? (
              <Card className="mt-3 border-border/70">
                <CardContent className="flex items-center justify-between gap-3 py-2 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate" title={exportPath}>
                    {exportMessage}
                  </span>
                  {exportPath ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 text-xs"
                      onClick={() => onRevealPath(exportPath)}
                    >
                      Reveal
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            {exportError ? (
              <Card className="mt-3 border-destructive/40 bg-destructive/10">
                <CardContent className="whitespace-pre-wrap py-2 text-xs text-destructive">
                  {exportError}
                </CardContent>
              </Card>
            ) : null}
            {previewError ? (
              <Card className="mt-3 border-destructive/40 bg-destructive/10">
                <CardContent className="py-2 text-xs text-destructive">
                  {previewError}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : status === "submitted" || status === "streaming" ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center">
            <div className="w-full max-w-xs">
              <IconLayoutBoard
                className="mx-auto mb-3 size-7 animate-pulse text-muted-foreground"
                strokeWidth={1.4}
              />
              <p className="text-sm font-normal">Waiting for artifact</p>
              <p className="mt-1 text-xs font-light text-muted-foreground">
                The agent is working. Once it writes `index.html`, the preview
                will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center">
            <div>
              <IconLayoutBoard
                className="mx-auto mb-3 size-7 text-muted-foreground"
                strokeWidth={1.4}
              />
              <p className="text-sm font-normal">No decks yet</p>
              <p className="mt-1 text-xs font-light text-muted-foreground">
                Ask the agent to create a deck. The generated HTML artifact will
                preview here.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
