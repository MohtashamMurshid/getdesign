import type { PhaseId, PhaseState } from "./types";

const PHASES: { id: PhaseId; label: string; detail: string }[] = [
  { id: "crawl", label: "Crawl", detail: "Read stylesheets and DOM" },
  { id: "capture", label: "Capture", detail: "Full landing page screenshot" },
  { id: "visual", label: "Visual", detail: "Tile sequence ready" },
  { id: "describe", label: "Describe", detail: "Long-form visual walkthrough" },
  { id: "extract", label: "Extract", detail: "Cluster CSS tokens" },
  { id: "synthesize", label: "Synthesize", detail: "Design doc from agent" },
  { id: "render", label: "Render", detail: "Write design.md" },
];

type PhaseListProps = {
  phases: Record<PhaseId, PhaseState>;
  errorMessage: string | null;
};

export function PhaseList({ phases, errorMessage }: PhaseListProps) {
  return (
    <ol className="space-y-px">
      {PHASES.map((phase) => {
        const state = phases[phase.id] ?? "pending";

        return (
          <li
            key={phase.id}
            className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-2.5 first:border-t-0"
          >
            <PhaseIndicator state={state} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={
                    state === "pending"
                      ? "text-[13px] text-[var(--subtle)]"
                      : "text-[13px] text-foreground"
                  }
                >
                  {phase.label}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
                  {state === "pending"
                    ? "—"
                    : state === "running"
                      ? "running"
                      : state === "ok"
                        ? "ok"
                        : "error"}
                </span>
              </div>
              <div className="text-[11.5px] text-[var(--subtle)]">
                {phase.detail}
              </div>
            </div>
          </li>
        );
      })}
      {errorMessage ? (
        <li className="mt-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-200)] px-4 py-3 text-[12.5px] text-[var(--danger)]">
          {errorMessage}
        </li>
      ) : null}
    </ol>
  );
}

function PhaseIndicator({ state }: { state: PhaseState }) {
  if (state === "ok") {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-200)] text-[10px] text-[var(--accent)]">
        ✓
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-200)]">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-200)] text-[10px] text-[var(--danger)]">
        ×
      </span>
    );
  }
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--border-strong)]">
      <span className="h-1 w-1 rounded-full bg-[var(--subtle)]" />
    </span>
  );
}
