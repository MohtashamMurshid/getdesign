import type { Site } from "../types";

type CliSurfaceProps = {
  site: Site;
  visibleSteps: number;
  done: boolean;
};

export function CliSurface({ site, visibleSteps, done }: CliSurfaceProps) {
  return (
    <div className="code-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--background)] px-4 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="fade-in-up">
        <span className="text-[var(--accent)]">$</span>{" "}
        <span className="text-foreground">npx @getdesign/cli {site.url}</span>
      </div>

      {visibleSteps >= 1 ? (
        <div className="fade-in-up mt-2 text-muted">
          <span className="tok-com">↳ getdesign v0.1.0 · streaming to stdout</span>
        </div>
      ) : null}

      {visibleSteps >= 2 ? (
        <div className="fade-in-up mt-3 text-muted">
          <span className="tok-com">✓</span> crawled html + 4 stylesheets
          <span className="text-[var(--subtle)]"> 128ms</span>
        </div>
      ) : null}

      {visibleSteps >= 4 ? (
        <div className="fade-in-up text-muted">
          <span className="tok-com">✓</span> screenshot 1440×900
          <span className="text-[var(--subtle)]"> 1.2MB</span>
        </div>
      ) : null}

      {visibleSteps >= 6 ? (
        <div className="fade-in-up text-muted">
          <span className="tok-com">✓</span> extracted 14 tokens · 4 palette · 2
          fonts
        </div>
      ) : null}

      {visibleSteps >= 7 ? (
        <div className="fade-in-up mt-3 text-foreground">
          <span className="tok-key"># {site.url}</span>
          {"\n"}
          <span className="text-muted">
            ## Visual Theme{"\n"}
            {site.theme}.{"\n\n"}
            ## Palette{"\n"}
            {site.palette.map((color) => `- ${color}\n`).join("")}
          </span>
          <span className="caret" />
        </div>
      ) : null}

      {done ? (
        <div className="fade-in-up mt-4 text-muted">
          <span className="tok-com">✓</span> wrote{" "}
          <span className="tok-str">design.md</span>{" "}
          <span className="text-[var(--subtle)]">14.3KB · 8.2s</span>
          {"\n"}
          <span className="text-[var(--accent)]">$</span> <span className="caret" />
        </div>
      ) : null}
    </div>
  );
}
