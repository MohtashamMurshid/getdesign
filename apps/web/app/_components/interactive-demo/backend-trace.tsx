import type { RefObject } from "react";

import type { Step } from "./types";

type BackendTraceProps = {
  steps: Step[];
  visibleSteps: number;
  done: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onReplay: () => void;
};

export function BackendTrace({
  steps,
  visibleSteps,
  done,
  scrollRef,
  onReplay,
}: BackendTraceProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-100)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="text-[10.5px] uppercase tracking-[0.2em] text-[var(--subtle)]">
          Backend
        </div>
        <div className="font-mono text-[10.5px] text-[var(--subtle)]">
          agent.run
        </div>
      </div>

      <div
        ref={scrollRef}
        className="code-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed"
      >
        {steps.slice(0, visibleSteps).map((step, index) => (
          <div key={index} className="fade-in-up flex gap-2">
            <span className="mt-[3px] shrink-0">
              {step.kind === "call" ? (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[var(--border-strong)] bg-[var(--surface-200)] text-[9px] text-[var(--accent)]">
                  ▶
                </span>
              ) : null}
              {step.kind === "ok" ? (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] text-[var(--accent)]">
                  ✓
                </span>
              ) : null}
              {step.kind === "info" ? (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] text-muted">
                  ◦
                </span>
              ) : null}
              {step.kind === "err" ? (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] text-[var(--danger)]">
                  ×
                </span>
              ) : null}
            </span>
            <div
              className={
                step.kind === "ok" || step.kind === "info"
                  ? "text-muted"
                  : "text-foreground"
              }
            >
              {step.label}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-[11.5px]">
        {done ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-muted">
              <span className="tok-num">200</span> OK ·{" "}
              <span className="tok-num">8.2s</span> · 14.3KB
            </span>
            <button
              onClick={onReplay}
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              replay ↻
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--subtle)]">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span className="font-mono">
              thinking<span className="caret" />
            </span>
            <span className="ml-auto font-mono text-[10.5px]">
              {visibleSteps}/{steps.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
