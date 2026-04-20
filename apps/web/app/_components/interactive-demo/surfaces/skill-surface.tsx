import type { Site } from "../types";

type SkillSurfaceProps = {
  site: Site;
  visibleSteps: number;
  done: boolean;
};

export function SkillSurface({
  site,
  visibleSteps,
  done,
}: SkillSurfaceProps) {
  return (
    <div className="px-4 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="fade-in-up">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
          install
        </div>
        <pre className="m-0 mt-2 whitespace-pre-wrap break-words rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 font-mono text-[12.5px] leading-relaxed text-foreground">
          <span className="text-[var(--accent)]">$</span>{" "}
          <span className="tok-fn">npx</span>{" "}
          <span className="text-foreground">
            skills add MohtashamMurshid/getdesign
          </span>
          {"\n"}
          <span className="tok-com">
            ✓ installed to .claude/skills/ · .codex/skills/ · .cursor/skills/
          </span>
        </pre>
      </div>

      {visibleSteps >= 1 ? (
        <div className="fade-in-up mt-5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            agent prompt
          </div>
          <div className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 text-muted">
            <span className="text-foreground">
              extract the design system from {site.url}
            </span>
          </div>
        </div>
      ) : null}

      {visibleSteps >= 2 ? (
        <div className="fade-in-up mt-5">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            agent trace
            <span className="rounded-[3px] border border-[var(--border-strong)] px-1 py-[1px] text-[9.5px] text-[var(--accent)]">
              skill: getdesign
            </span>
          </div>
          <div className="mt-2 space-y-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 text-muted">
            <div>
              <span className="tok-com">▶</span>{" "}
              <span className="tok-fn">WebFetch</span>
              <span className="tok-punc">(</span>
              <span className="tok-str">&quot;{site.url}&quot;</span>
              <span className="tok-punc">)</span>
            </div>
            {visibleSteps >= 3 ? (
              <div>
                <span className="tok-com">▶</span>{" "}
                <span className="tok-fn">WebFetch</span>
                <span className="tok-punc">(</span>
                <span className="tok-str">&quot;/styles.css&quot;</span>
                <span className="tok-punc">)</span>
              </div>
            ) : null}
            {visibleSteps >= 4 ? (
              <div>
                <span className="tok-com">▶</span>{" "}
                <span className="tok-fn">browser.screenshot</span>
                <span className="tok-punc">({"{ viewport: 1440x900 }"})</span>
              </div>
            ) : null}
            {visibleSteps >= 6 ? (
              <div>
                <span className="tok-com">▶</span>{" "}
                <span className="tok-fn">Write</span>
                <span className="tok-punc">(</span>
                <span className="tok-str">&quot;design.md&quot;</span>
                <span className="tok-punc">)</span>
              </div>
            ) : null}
            {done ? (
              <div className="pt-1 text-foreground">
                <span className="tok-com">✓</span> wrote{" "}
                <span className="tok-str">design.md</span>{" "}
                <span className="text-[var(--subtle)]">
                  · 9 sections · grounded in actual CSS
                </span>
              </div>
            ) : null}
            <span className="caret" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
