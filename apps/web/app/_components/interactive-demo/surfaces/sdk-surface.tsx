import type { Site } from "../types";

type SdkSurfaceProps = {
  site: Site;
  visibleSteps: number;
  done: boolean;
};

export function SdkSurface({ site, visibleSteps, done }: SdkSurfaceProps) {
  return (
    <div className="px-4 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="fade-in-up">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
          app.ts
        </div>
        <pre className="m-0 mt-2 whitespace-pre-wrap break-words rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 font-mono text-[12.5px] leading-relaxed text-foreground">
          <span className="tok-key">import</span>{" "}
          <span className="text-foreground">{"{ streamDesign }"}</span>{" "}
          <span className="tok-key">from</span>{" "}
          <span className="tok-str">&quot;@getdesign/sdk&quot;</span>;{"\n"}
          {"\n"}
          <span className="tok-key">const</span>{" "}
          <span className="text-foreground">stream</span> ={" "}
          <span className="tok-fn">streamDesign</span>(
          <span className="tok-str">&quot;{site.url}&quot;</span>);{"\n"}
          {"\n"}
          <span className="tok-key">for await</span>{" "}
          <span className="tok-punc">(</span>
          <span className="tok-key">const</span>{" "}
          <span className="text-foreground">chunk</span>{" "}
          <span className="tok-key">of</span>{" "}
          <span className="text-foreground">stream</span>
          <span className="tok-punc">) {"{"}</span>
          {"\n"}
          {"  "}
          <span className="text-foreground">
            process.stdout.write(chunk);
          </span>
          {"\n"}
          <span className="tok-punc">{"}"}</span>
        </pre>
      </div>

      {visibleSteps >= 2 ? (
        <div className="fade-in-up mt-5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            stdout
          </div>
          <pre className="m-0 mt-2 whitespace-pre-wrap break-words rounded-md border border-[var(--border)] bg-[var(--surface-200)] p-3 font-mono text-[12.5px] leading-relaxed text-muted">
            <span className="tok-key"># {site.url}</span>
            {"\n\n"}
            <span className="tok-key">## Visual Theme</span>
            {"\n"}
            <span className="text-foreground">{site.theme}.</span>
            {"\n"}
            {visibleSteps >= 5 ? (
              <>
                {"\n"}
                <span className="tok-key">## Palette</span>
                {"\n"}
                {site.palette.map((color) => (
                  <span key={color}>
                    - <span className="tok-str">{color}</span>
                    {"\n"}
                  </span>
                ))}
              </>
            ) : null}
            {done ? (
              <span className="tok-com">{"\n"}// stream closed · 14.3KB</span>
            ) : null}
            <span className="caret" />
          </pre>
        </div>
      ) : null}
    </div>
  );
}
