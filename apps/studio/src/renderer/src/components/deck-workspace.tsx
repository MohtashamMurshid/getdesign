import { useMemo, useState } from "react";
import {
  IconExternalLink,
  IconFileExport,
  IconFileTypePdf,
  IconFileTypePpt,
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
  onOpenDeck: (deckId: string) => Promise<void>;
  onExportDeck: (
    deckId: string,
    format: StudioDeckExportFormat,
  ) => Promise<StudioExportDeckResult>;
};

export function DeckWorkspace({
  decks,
  selectedDeckId,
  status,
  onOpenDeck,
  onExportDeck,
}: DeckWorkspaceProps) {
  const [exportMessage, setExportMessage] = useState<string | undefined>();
  const [previewKey, setPreviewKey] = useState(0);
  const [previewError, setPreviewError] = useState<string | undefined>();

  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId),
    [decks, selectedDeckId],
  );

  async function handleExport(format: StudioDeckExportFormat) {
    if (!selectedDeck) return;
    const result = await onExportDeck(selectedDeck.id, format);
    setExportMessage(`${result.message} ${result.path}`);
  }

  return (
    <aside className="flex min-h-0 w-[42%] min-w-[420px] flex-col border-l border-border/70 bg-muted/20">
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Preview</h2>
            <p className="text-xs text-muted-foreground">
              Agent-generated HTML decks appear here.
            </p>
          </div>
          <IconLayoutBoard className="size-5 text-muted-foreground" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        {selectedDeck ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium">
                  {selectedDeck.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedDeck.slides.length} slides · {selectedDeck.mode}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenDeck(selectedDeck.id)}
                >
                  <IconExternalLink size={15} />
                  Folder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewError(undefined);
                    setPreviewKey((key) => key + 1);
                  }}
                >
                  <IconRefresh size={15} />
                  Reload
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-black">
              <iframe
                key={`${selectedDeck.id}-${previewKey}`}
                title={`${selectedDeck.title} preview`}
                src={selectedDeck.previewUrl}
                onLoad={() => setPreviewError(undefined)}
                onError={() => setPreviewError("Preview failed to load.")}
                className="h-full w-full border-0 bg-black"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => handleExport("html")}>
                <IconFileExport size={15} />
                HTML
              </Button>
              <Button variant="secondary" onClick={() => handleExport("pdf")}>
                <IconFileTypePdf size={15} />
                PDF
              </Button>
              <Button variant="secondary" onClick={() => handleExport("pptx")}>
                <IconFileTypePpt size={15} />
                PPTX
              </Button>
            </div>

            {exportMessage ? (
              <Card className="mt-3 border-border/70">
                <CardContent className="py-2 text-xs text-muted-foreground">
                  {exportMessage}
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
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-background/60 p-8 text-center">
            <div className="w-full max-w-xs">
              <IconLayoutBoard className="mx-auto mb-3 size-8 animate-pulse text-muted-foreground" />
              <p className="text-sm font-medium">Waiting for artifact</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The agent is working. Once it writes `index.html`, the preview
                will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-background/60 p-8 text-center">
            <div>
              <IconLayoutBoard className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">No decks yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
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
