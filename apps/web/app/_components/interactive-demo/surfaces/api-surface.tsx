import type { Site } from "../types";

type ApiSurfaceProps = {
  site: Site;
  visibleSteps: number;
  done: boolean;
};

export function ApiSurface({ site, visibleSteps, done }: ApiSurfaceProps) {
  return (
    <div className="code-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="fade-in-up">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
          request
        </div>
        <div className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 text-foreground">
          <span className="tok-key">GET</span>{" "}
          <span className="tok-str">
            https://api.getdesign.app/?url={site.url}
          </span>
          {"\n"}
          <span className="tok-com">Accept: text/markdown</span>
        </div>
      </div>

      {visibleSteps >= 2 ? (
        <div className="fade-in-up mt-5">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            response
            <span className="rounded-[3px] border border-[var(--border-strong)] px-1 py-[1px] text-[9.5px] text-[var(--accent)]">
              {done ? "200 OK" : "200 streaming"}
            </span>
          </div>
          <div className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 text-muted">
            <span className="tok-com"># {site.url}</span>
            {"\n\n"}
            {visibleSteps >= 2 ? (
              <>
                <span className="tok-key">## Visual Theme</span>
                {"\n"}
                <span className="text-foreground">{site.theme}.</span>
                {"\n\n"}
              </>
            ) : null}
            {visibleSteps >= 5 ? (
              <>
                <span className="tok-key">## Palette</span>
                {"\n"}
                {site.palette.map((color) => (
                  <span key={color}>
                    - <span className="tok-str">{color}</span>
                    {"\n"}
                  </span>
                ))}
                {"\n"}
                <span className="tok-key">## Typography</span>
                {"\n"}
                - display: <span className="tok-str">{site.fonts[0]}</span>
                {"\n"}
                - mono: <span className="tok-str">{site.fonts[1]}</span>
                {"\n"}
              </>
            ) : null}
            {done ? (
              <span className="tok-com">{"\n"}… +5 sections · 14.3KB total</span>
            ) : null}
            <span className="caret" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
