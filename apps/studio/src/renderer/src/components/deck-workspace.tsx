import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconChevronRight,
  IconExternalLink,
  IconFileTypePdf,
  IconFileTypePpt,
  IconLayoutSidebarLeftExpand,
  IconLayoutBoard,
  IconNotes,
  IconRefresh,
  IconSparkles,
  IconWorld,
} from "@tabler/icons-react";

import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import type {
  StudioDeckExportFormat,
  StudioDeckProject,
  StudioDeckTemplateSummary,
  StudioDeckTweaks,
  StudioDeckVerificationResult,
  StudioExportDeckResult,
} from "../../../shared/studio-api";

import { cn } from "@/lib/utils";

type DeckWorkspaceProps = {
  decks: StudioDeckProject[];
  selectedDeckId?: string;
  status: "ready" | "submitted" | "streaming" | "error";
  showChatToggle?: boolean;
  darwinTrafficLightInset?: boolean;
  onShowChat?: () => void;
  onSelectDeck: (deckId: string) => void;
  onOpenDeck: (deckId: string) => Promise<void>;
  onRevealPath: (path: string) => Promise<void>;
  onExportDeck: (
    deckId: string,
    format: StudioDeckExportFormat,
  ) => Promise<StudioExportDeckResult>;
};

const THEMES: Array<NonNullable<StudioDeckTweaks["theme"]>> = [
  "default",
  "light",
  "dark",
  "warm",
  "cool",
];
const DENSITIES: Array<NonNullable<StudioDeckTweaks["density"]>> = [
  "comfortable",
  "compact",
  "spacious",
];

export function DeckWorkspace({
  decks,
  selectedDeckId,
  status,
  showChatToggle = false,
  darwinTrafficLightInset = false,
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
  // Plan confirmation has moved fully into the chat (see ChatPlanCard). The
  // right-panel pill is status-only and clicking it just surfaces the chat.
  const [verification, setVerification] = useState<StudioDeckVerificationResult | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [tweaksBusy, setTweaksBusy] = useState(false);
  const [templates, setTemplates] = useState<StudioDeckTemplateSummary[]>([]);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | undefined>();
  const selectedDeckIdRef = useRef<string | undefined>(selectedDeckId);

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
  const planConfirmed = selectedDeck?.plan?.status === "confirmed";
  const planPending = Boolean(selectedDeck?.plan && !planConfirmed);
  const hasSlides = Boolean(selectedDeck && selectedDeck.slides.length > 0);
  const exportsBlocked = !planConfirmed || !hasSlides;

  useEffect(() => {
    selectedDeckIdRef.current = selectedDeckId;
  }, [selectedDeckId]);

  // Reset transient panel state when the user switches decks.
  useEffect(() => {
    setVerification(undefined);
    setExportError(undefined);
    setExportMessage(undefined);
    setExportPath(undefined);
  }, [selectedDeckId]);

  // Lazy-load template list on first render so the empty state can render
  // them without an extra round-trip later.
  useEffect(() => {
    let cancelled = false;
    void window.api
      .listDeckTemplates()
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExport(format: StudioDeckExportFormat) {
    if (!selectedDeck) return;
    const requestDeckId = selectedDeck.id;
    setExportingFormat(format);
    setExportError(undefined);
    setExportMessage(undefined);
    setExportPath(undefined);
    try {
      const result = await onExportDeck(requestDeckId, format);
      if (selectedDeckIdRef.current !== requestDeckId) return;
      setExportMessage(result.message);
      setExportPath(result.path);
    } catch (error) {
      if (selectedDeckIdRef.current !== requestDeckId) return;
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      if (selectedDeckIdRef.current === requestDeckId) setExportingFormat(undefined);
    }
  }

  async function handleVerify() {
    if (!selectedDeck) return;
    const requestDeckId = selectedDeck.id;
    setVerifying(true);
    try {
      const result = await window.api.verifyDeck(requestDeckId);
      if (selectedDeckIdRef.current !== requestDeckId) return;
      setVerification(result);
    } catch (error) {
      if (selectedDeckIdRef.current !== requestDeckId) return;
      setVerification({
        ok: false,
        issues: [
          {
            level: "error",
            message: error instanceof Error ? error.message : "Verification failed.",
          },
        ],
        checkedAt: Date.now(),
      });
    } finally {
      if (selectedDeckIdRef.current === requestDeckId) setVerifying(false);
    }
  }

  async function handleTweakChange(patch: Partial<StudioDeckTweaks>) {
    if (!selectedDeck) return;
    const requestDeckId = selectedDeck.id;
    setTweaksBusy(true);
    try {
      const next: StudioDeckTweaks = { ...(selectedDeck.tweaks ?? {}), ...patch };
      await window.api.applyDeckTweaks({ deckId: requestDeckId, tweaks: next });
      if (selectedDeckIdRef.current !== requestDeckId) return;
      setPreviewKey((key) => key + 1);
    } catch (error) {
      if (selectedDeckIdRef.current !== requestDeckId) return;
      setExportError(
        error instanceof Error ? error.message : "Could not apply tweaks.",
      );
    } finally {
      if (selectedDeckIdRef.current === requestDeckId) setTweaksBusy(false);
    }
  }

  async function handleCreateFromTemplate(templateId: string) {
    setCreatingTemplateId(templateId);
    try {
      await window.api.createDeckFromTemplate({ templateId });
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Could not create deck from template.",
      );
    } finally {
      setCreatingTemplateId(undefined);
    }
  }

  return (
    <aside className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div
        className={cn(
          "flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/70",
          darwinTrafficLightInset ? "ps-[78px] pe-3" : "px-3",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showChatToggle && onShowChat ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onShowChat}
              aria-label="Show chat"
              title="Show chat"
            >
              <IconLayoutSidebarLeftExpand size={16} />
            </Button>
          ) : null}
          {decks.length > 1 && selectedDeck ? (
            // Multi-deck picker: replaces the breadcrumb when there's > 1 generation.
            <Select
              value={selectedDeck.id}
              onValueChange={(value) => {
                setPreviewError(undefined);
                onSelectDeck(value);
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-7 max-w-[220px] border-border/60 text-xs"
              >
                <SelectValue placeholder="Select deck" />
              </SelectTrigger>
              <SelectContent align="start">
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span>project</span>
              {selectedDeck ? (
                <>
                  <IconChevronRight size={12} />
                  <span className="truncate text-foreground/80" title={selectedDeck.path}>
                    {selectedDeck.title}
                  </span>
                </>
              ) : null}
            </div>
          )}
          {selectedDeck ? (
            <span className="hidden shrink-0 text-[11px] text-muted-foreground/70 sm:inline">
              {selectedDeck.slides.length}p · {selectedDeck.mode}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5">
          {selectedDeck ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={verifying}
                onClick={handleVerify}
                aria-label={verifying ? "Verifying" : "Verify deck"}
                title={verifying ? "Verifying..." : "Verify deck"}
              >
                <IconSparkles size={15} className={verifying ? "animate-pulse" : undefined} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-7", notesOpen && "bg-muted text-foreground")}
                onClick={() => setNotesOpen((open) => !open)}
                aria-label="Speaker notes"
                title="Speaker notes"
              >
                <IconNotes size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => {
                  setPreviewError(undefined);
                  setPreviewKey((key) => key + 1);
                }}
                aria-label="Reload preview"
                title="Reload preview"
              >
                <IconRefresh size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onOpenDeck(selectedDeck.id)}
                aria-label="Open deck folder"
                title="Open folder"
              >
                <IconExternalLink size={15} />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        {selectedDeck ? (
          <>
            <PlanStatusPill deck={selectedDeck} onShowChat={onShowChat} />

            <TweaksRow
              deck={selectedDeck}
              busy={tweaksBusy}
              onChange={handleTweakChange}
            />

            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border/80 bg-black">
              {hasSlides ? (
                <iframe
                  key={`${selectedDeck.id}-${selectedDeck.updatedAt}-${previewKey}`}
                  title={`${selectedDeck.title} preview`}
                  src={previewSrc}
                  onLoad={() => setPreviewError(undefined)}
                  onError={() => setPreviewError("Preview failed to load.")}
                  className="h-full w-full border-0 bg-black"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  {planPending
                    ? "Confirm the plan above so the agent can write slides."
                    : "No slides yet. The agent will write them once the plan is confirmed."}
                </div>
              )}
            </div>

            <ExportBar
              mode={selectedDeck.mode}
              exportingFormat={exportingFormat}
              disabled={exportsBlocked}
              disabledReason={exportsBlocked ? "Confirm the deck plan to enable exports." : undefined}
              onExport={handleExport}
            />

            {verification ? <VerificationCard result={verification} /> : null}
            {notesOpen ? <NotesPanel deck={selectedDeck} /> : null}

            {exportMessage ? (
              <Card className="border-border/70">
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
              <Card className="border-destructive/40 bg-destructive/10">
                <CardContent className="whitespace-pre-wrap py-2 text-xs text-destructive">
                  {exportError}
                </CardContent>
              </Card>
            ) : null}
            {previewError ? (
              <Card className="border-destructive/40 bg-destructive/10">
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
          <EmptyState
            templates={templates}
            creatingTemplateId={creatingTemplateId}
            exportError={exportError}
            onCreate={handleCreateFromTemplate}
          />
        )}
      </div>
    </aside>
  );
}

/**
 * Status-only pill: plan confirmation now happens in the chat (ChatPlanCard).
 * The right panel just surfaces "where is my plan?" so the user knows whether
 * the export buttons will work, and provides a way to jump to the chat card.
 */
function PlanStatusPill({
  deck,
  onShowChat,
}: {
  deck: StudioDeckProject;
  onShowChat?: () => void;
}) {
  const plan = deck.plan;

  if (!plan) {
    return (
      <div className="mb-2 rounded-md border border-amber-400/40 bg-amber-50/40 px-3 py-1.5 text-xs text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
        No plan yet — ask the agent to write deck-plan.json.
      </div>
    );
  }

  const confirmed = plan.status === "confirmed";

  if (confirmed) {
    return (
      <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-md border border-emerald-400/40 bg-emerald-50/40 px-2.5 py-1 text-[11px] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
        ✓ Plan confirmed
      </div>
    );
  }

  // Pending — nudge the user to the chat where the real card is when possible.
  if (!onShowChat) {
    return (
      <span className="mb-2 inline-flex items-center gap-1.5 self-start rounded-md border border-amber-400/40 bg-amber-50/40 px-2.5 py-1 text-[11px] text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
        Plan pending — confirm in chat
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onShowChat}
      className="mb-2 inline-flex items-center gap-1.5 self-start rounded-md border border-amber-400/40 bg-amber-50/40 px-2.5 py-1 text-[11px] text-amber-700 hover:bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/15"
      title="Confirm in chat"
    >
      Plan pending — confirm in chat
      <IconChevronRight size={12} />
    </button>
  );
}

function VerificationCard({ result }: { result: StudioDeckVerificationResult }) {
  const errors = result.issues.filter((issue) => issue.level === "error");
  const warnings = result.issues.filter((issue) => issue.level === "warning");
  const ok = result.ok && warnings.length === 0;
  return (
    <Card
      className={cn(
        "mt-3",
        ok
          ? "border-emerald-400/40 bg-emerald-50/40 dark:border-emerald-400/30 dark:bg-emerald-400/10"
          : "border-destructive/40 bg-destructive/10",
      )}
    >
      <CardContent className="space-y-2 py-2 text-xs">
        <p className="font-medium">
          {ok
            ? "Verification passed"
            : `${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
        </p>
        {result.issues.length > 0 ? (
          <ul className="space-y-1">
            {result.issues.map((issue, index) => (
              <li
                key={`${issue.level}-${index}`}
                className={cn(
                  issue.level === "error" ? "text-destructive" : "text-amber-700",
                )}
              >
                {issue.slide ? <span className="font-mono">{issue.slide}: </span> : null}
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function NotesPanel({ deck }: { deck: StudioDeckProject }) {
  return (
    <Card className="mt-3 border-border/70">
      <CardContent className="space-y-3 py-3 text-xs">
        <p className="text-muted-foreground">
          Speaker notes from deck.json. Edit slides[i].notes or use
          {" "}
          <code className="font-mono text-foreground/90">
            &lt;aside class=&quot;notes&quot; hidden&gt;
          </code>{" "}
          inline.
        </p>
        <ul className="space-y-2">
          {deck.slides.map((slide) => (
            <li key={slide.id} className="rounded border border-border/60 p-2">
              <p className="font-medium text-foreground/90">
                {slide.label || slide.title}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {slide.notes && slide.notes.trim().length > 0
                  ? slide.notes
                  : "No speaker notes for this slide yet."}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TweaksRow({
  deck,
  busy,
  onChange,
}: {
  deck: StudioDeckProject;
  busy: boolean;
  onChange: (patch: Partial<StudioDeckTweaks>) => void;
}) {
  const current = deck.tweaks ?? {};
  const theme = current.theme ?? "default";
  const density = current.density ?? "comfortable";
  return (
    <div
      className="flex items-center gap-2 text-xs"
      title="Tweaks write shared/tweaks.css. Slides must link shared/tweaks.css for changes to take effect."
    >
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
        Tweaks
      </span>
      <Select
        value={theme}
        disabled={busy}
        onValueChange={(value) =>
          onChange({ theme: value as StudioDeckTweaks["theme"] })
        }
      >
        <SelectTrigger size="sm" className="h-7 min-w-[120px] border-border/60 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {THEMES.map((value) => (
            <SelectItem key={value} value={value}>
              {capitalize(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={density}
        disabled={busy}
        onValueChange={(value) =>
          onChange({ density: value as StudioDeckTweaks["density"] })
        }
      >
        <SelectTrigger size="sm" className="h-7 min-w-[130px] border-border/60 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DENSITIES.map((value) => (
            <SelectItem key={value} value={value}>
              {capitalize(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Segmented export control. Three formats sit in a single rounded border with
 * vertical dividers — visually one control instead of three competing buttons.
 */
function ExportBar({
  mode,
  exportingFormat,
  disabled,
  disabledReason,
  onExport,
}: {
  mode: StudioDeckProject["mode"];
  exportingFormat: StudioDeckExportFormat | undefined;
  disabled: boolean;
  disabledReason?: string;
  onExport: (format: StudioDeckExportFormat) => void;
}) {
  const pptxAvailable = mode === "pptx-safe";
  const items: Array<{
    format: StudioDeckExportFormat;
    label: string;
    icon: typeof IconWorld;
    available: boolean;
    title?: string;
  }> = [
    { format: "html", label: "HTML", icon: IconWorld, available: true },
    { format: "pdf", label: "PDF", icon: IconFileTypePdf, available: true },
    {
      format: "pptx",
      label: "PPTX",
      icon: IconFileTypePpt,
      available: pptxAvailable,
      title: pptxAvailable
        ? "Export editable PPTX"
        : "Editable PPTX requires pptx-safe authoring",
    },
  ];
  return (
    <div
      className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-md border border-border/80 bg-background"
      role="group"
      aria-label="Export deck"
    >
      {items.map((item, index) => {
        const isExporting = exportingFormat === item.format;
        const itemDisabled = disabled || !item.available || Boolean(exportingFormat);
        const Icon = item.icon;
        return (
          <button
            key={item.format}
            type="button"
            disabled={itemDisabled}
            onClick={() => onExport(item.format)}
            title={disabled ? disabledReason : item.title}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 text-xs font-medium transition-colors",
              "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
              index > 0 && "border-l border-border/60",
            )}
          >
            <Icon size={14} className="text-muted-foreground" />
            {isExporting
              ? item.format === "html"
                ? "Opening…"
                : "Exporting…"
              : item.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({
  templates,
  creatingTemplateId,
  exportError,
  onCreate,
}: {
  templates: StudioDeckTemplateSummary[];
  creatingTemplateId?: string;
  exportError?: string;
  onCreate: (templateId: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 p-6 text-center">
      <div>
        <IconLayoutBoard
          className="mx-auto mb-3 size-7 text-muted-foreground"
          strokeWidth={1.4}
        />
        <p className="text-sm font-normal">No decks yet</p>
        <p className="mt-1 text-xs font-light text-muted-foreground">
          Ask the agent to create a deck or start from a curated template.
        </p>
      </div>
      {templates.length > 0 ? (
        <ul className="grid w-full max-w-xl grid-cols-1 gap-2 text-left">
          {templates.map((template) => {
            const busy = creatingTemplateId === template.id;
            return (
              <li
                key={template.id}
                className="rounded border border-border/70 bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{template.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {template.slideCount} slides · {template.mode}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 shrink-0 text-xs"
                    disabled={Boolean(creatingTemplateId)}
                    onClick={() => onCreate(template.id)}
                  >
                    {busy ? "Creating..." : "Use"}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {template.description}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
      {exportError ? (
        <Card className="w-full max-w-xl border-destructive/40 bg-destructive/10 text-left">
          <CardContent className="whitespace-pre-wrap py-2 text-xs text-destructive">
            {exportError}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
