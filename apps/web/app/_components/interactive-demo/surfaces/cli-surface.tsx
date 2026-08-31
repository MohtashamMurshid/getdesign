import type { Site } from "../types";

type CliSurfaceProps = {
  site: Site;
  visibleSteps: number;
  done: boolean;
};

export function CliSurface({ site, visibleSteps, done }: CliSurfaceProps) {
  return (
    <div className="bg-[var(--background)] px-4 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="fade-in-up">
        <p className="mb-2 text-[11px] text-[var(--subtle)]">
          Requires Bun. Set DAYTONA_API_KEY and OPENAI_API_KEY in your shell.
        </p>
        <span className="text-[var(--accent)]">$</span>{" "}
        <span className="text-foreground">bunx @getdesign/cli https://{site.url} --out design.md</span>
      </div>

      {visibleSteps >= 1 ? (
        <div className="fade-in-up mt-2 text-muted">
          <span className="tok-com">↳ sample progress · output file: design.md</span>
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
          <span className="tok-com">✓</span> full landing page capture
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
        <pre className="fade-in-up m-0 mt-3 whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-foreground">
          <span className="tok-com"># Sample output file: design.md</span>
          {"\n\n"}
          <span className="tok-key"># {site.url}</span>
          {"\n"}
          <span className="text-muted">
            ## Visual Theme{"\n"}
            {site.theme}.{"\n\n"}
            ## Palette{"\n"}
            {site.palette.map((color) => `- ${color}\n`).join("")}
          </span>
          <span className="caret" />
        </pre>
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
