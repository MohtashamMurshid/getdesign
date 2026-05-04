import { useState } from "react";
import {
  IconCheck,
  IconExternalLink,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

import type {
  StudioChatStatus,
  StudioDeckPlanCardData,
  StudioMessage,
  StudioPlanConfirmedNoteData,
} from "../../../../shared/studio-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Inline chat card representing a deck-plan.json on disk.
 * Three visual states:
 *   - pending      → amber, "Confirm" button enabled (unless agent streaming)
 *   - confirmed    → emerald check, no action button (collapses by default)
 *   - superseded   → muted/dimmed, "Replaced by newer plan below"
 */
export function ChatPlanCard({
  message,
  data,
  status,
}: {
  message: StudioMessage;
  data: StudioDeckPlanCardData;
  status: StudioChatStatus;
}) {
  const { plan, superseded } = data;
  const confirmed = plan.status === "confirmed";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // Confirmed cards collapse by default (we already showed the user the plan
  // when it was pending, no need to take screen real-estate after the fact).
  const [expanded, setExpanded] = useState(!confirmed && !superseded);

  // Q11: disable confirm during streaming so we don't yank the agent mid-turn.
  const disabledByStream = status === "streaming" || status === "submitted";

  async function handleConfirm() {
    if (busy || confirmed || superseded) return;
    setBusy(true);
    setError(undefined);
    try {
      // Look up the deck id from the artifact id — they're aliased in Studio.
      await window.api.confirmDeckPlan({ deckId: data.artifactId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm plan.");
    } finally {
      setBusy(false);
    }
  }

  function handleOpenFile() {
    void window.api.revealPath(`${data.artifactPath}/deck-plan.json`);
  }

  // Collapsed confirmed state — thin one-line strip, click to expand.
  if (confirmed && !expanded && !superseded) {
    return (
      <PlanCardShell
        accent="emerald"
        compact
        onClick={() => setExpanded(true)}
        ariaLabel="Expand confirmed plan"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <IconCheck size={14} className="shrink-0" />
          <span className="font-medium">Plan confirmed</span>
          <span className="truncate opacity-70">
            · {plan.audience} · {plan.exportPath} · {plan.slideCount} slides
          </span>
        </span>
        <IconChevronDown size={14} className="shrink-0 opacity-60" />
      </PlanCardShell>
    );
  }

  return (
    <PlanCardShell
      accent={superseded ? "muted" : confirmed ? "emerald" : "amber"}
      data-message-id={message.id}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">
            {superseded
              ? "Plan replaced"
              : confirmed
                ? "Plan confirmed"
                : "Plan proposed"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenFile}
              className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              aria-label="Open deck-plan.json"
              title="Open deck-plan.json"
            >
              <IconExternalLink size={13} />
            </button>
            {confirmed && !superseded ? (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                aria-label="Collapse plan"
                title="Collapse plan"
              >
                <IconChevronUp size={13} />
              </button>
            ) : null}
          </div>
        </div>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
          <PlanRow label="Audience" value={plan.audience} />
          <PlanRow label="Key message" value={plan.keyMessage} />
          <PlanRow label="Export path" value={plan.exportPath} />
          <PlanRow label="Slides" value={String(plan.slideCount)} />
          <PlanRow label="Mode" value={plan.mode} />
          {plan.notes ? <PlanRow label="Notes" value={plan.notes} /> : null}
        </dl>
        {!confirmed && !superseded ? (
          <div className="flex items-center justify-end gap-2 pt-1">
            {error ? (
              <span className="mr-auto truncate text-xs text-destructive">
                {error}
              </span>
            ) : null}
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={busy || disabledByStream}
              title={
                disabledByStream ? "Waiting for agent to pause." : undefined
              }
              onClick={handleConfirm}
            >
              {busy ? "Confirming..." : "Confirm"}
            </Button>
          </div>
        ) : null}
        {superseded ? (
          <p className="text-xs text-muted-foreground">
            A newer plan has replaced this one. Scroll down to confirm the
            current proposal.
          </p>
        ) : null}
      </div>
    </PlanCardShell>
  );
}

/** Thin one-line "✓ Plan confirmed at HH:MM" system note. */
export function PlanConfirmedNote({ data }: { data: StudioPlanConfirmedNoteData }) {
  const time = new Date(data.confirmedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
        <IconCheck size={11} />
        Plan confirmed at {time}
      </span>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground/80">{label}</dt>
      <dd className="truncate text-foreground/90" title={value}>
        {value}
      </dd>
    </>
  );
}

type Accent = "amber" | "emerald" | "muted";

function PlanCardShell({
  accent,
  children,
  onClick,
  ariaLabel,
  compact,
  ...rest
}: {
  accent: Accent;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  compact?: boolean;
  [key: `data-${string}`]: string | undefined;
}) {
  const accentClass =
    accent === "emerald"
      ? "border-emerald-400/40 bg-emerald-50/40 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
      : accent === "amber"
        ? "border-amber-400/40 bg-amber-50/40 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        : "border-border/60 bg-muted/30 text-muted-foreground";

  const baseClass = cn(
    "w-full rounded-md border px-3 text-xs",
    compact
      ? "flex items-center justify-between gap-2 py-1.5 text-left transition-colors"
      : "flex gap-3 py-2.5",
    accentClass,
    onClick ? "hover:bg-foreground/[0.03]" : null,
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={baseClass}
        onClick={onClick}
        aria-label={ariaLabel}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={baseClass} {...rest}>
      {children}
    </div>
  );
}
