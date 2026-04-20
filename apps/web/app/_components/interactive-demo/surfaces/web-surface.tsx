import type { Site } from "../types";

type WebSurfaceProps = {
  site: Site;
  visibleSteps: number;
  done: boolean;
};

export function WebSurface({ site, visibleSteps, done }: WebSurfaceProps) {
  return (
    <div className="space-y-4 px-4 py-4 text-[13px]">
      <div className="fade-in-up flex justify-end">
        <div className="max-w-[78%] rounded-lg rounded-br-sm border border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-foreground">
          Extract the design system from{" "}
          <span className="font-mono text-[var(--accent)]">{site.url}</span>
        </div>
      </div>

      {visibleSteps >= 2 ? (
        <div className="fade-in-up flex justify-start">
          <div className="max-w-[86%] rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2.5 text-muted">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              ## Visual Theme
            </div>
            <div className="mt-1.5 text-foreground">{site.theme}.</div>
          </div>
        </div>
      ) : null}

      {visibleSteps >= 5 ? (
        <div className="fade-in-up flex justify-start">
          <div className="max-w-[86%] rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2.5 text-muted">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              ## Palette
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {site.palette.map((color) => (
                <div
                  key={color}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-200)] px-1.5 py-1 font-mono text-[11px] text-muted"
                >
                  <span
                    className="h-3 w-3 rounded-[3px] border border-[var(--border-strong)]"
                    style={{ background: color }}
                  />
                  {color}
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              ## Typography
            </div>
            <div className="mt-1.5 text-foreground">
              <span className="font-mono text-[12px] text-[var(--accent)]">
                {site.fonts[0]}
              </span>{" "}
              <span className="text-[var(--subtle)]">+</span>{" "}
              <span className="font-mono text-[12px] text-[var(--accent)]">
                {site.fonts[1]}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {done ? (
        <div className="fade-in-up flex justify-start">
          <div className="max-w-[86%] rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2.5 text-muted">
            <div className="text-foreground">
              design.md ready ·{" "}
              <span className="text-[var(--accent)]">9 sections</span>,
              grounded in actual CSS.
            </div>
            <div className="mt-1 font-mono text-[11px] text-[var(--subtle)]">
              {site.sections.join(" · ")} · +5 more
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
