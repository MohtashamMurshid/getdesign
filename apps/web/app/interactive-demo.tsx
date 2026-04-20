"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Site = {
  id: string;
  url: string;
  favicon: string;
  theme: string;
  palette: string[];
  fonts: [string, string];
  sections: string[];
};

const SITES: Site[] = [
  {
    id: "cursor",
    url: "cursor.com",
    favicon: "C",
    theme: "Warm minimalism meets code-editor elegance",
    palette: ["#f2f1ed", "#26251e", "#f54e00", "#cf2d56"],
    fonts: ["CursorGothic Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "components"],
  },
  {
    id: "linear",
    url: "linear.app",
    favicon: "L",
    theme: "Hyper-precise dark UI with signal-gradient accents",
    palette: ["#0a0a0b", "#e6e6e8", "#5e6ad2", "#ff4d6d"],
    fonts: ["Inter Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "interaction"],
  },
  {
    id: "stripe",
    url: "stripe.com",
    favicon: "S",
    theme: "Bright, confident, dense information architecture",
    palette: ["#ffffff", "#0a2540", "#635bff", "#00d4ff"],
    fonts: ["Sohne", "Sohne Mono"],
    sections: ["visualTheme", "palette", "typography", "layout"],
  },
];

type Step = {
  kind: "call" | "ok" | "info" | "err";
  label: React.ReactNode;
};

function buildSteps(site: Site): Step[] {
  return [
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.crawl</span>
          <span className="tok-punc">({"{ "}</span>
          <span className="tok-key">url</span>
          <span className="tok-punc">: </span>
          <span className="tok-str">&quot;{site.url}&quot;</span>
          <span className="tok-punc">{" }"})</span>
        </>
      ),
    },
    {
      kind: "ok",
      label: (
        <>
          fetched html + 4 stylesheets ·{" "}
          <span className="tok-num">128ms</span>
        </>
      ),
    },
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.screenshot</span>
          <span className="tok-punc">({"{ "}</span>
          <span className="tok-key">viewport</span>
          <span className="tok-punc">: </span>
          <span className="tok-str">&quot;1440x900&quot;</span>
          <span className="tok-punc">{" }"})</span>
        </>
      ),
    },
    {
      kind: "info",
      label: (
        <>
          chromium · daytona sandbox · hero.png{" "}
          <span className="tok-com">1.2MB</span>
        </>
      ),
    },
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.extract</span>
          <span className="tok-punc">({"{ "}</span>
          <span className="tok-key">tokens</span>
          <span className="tok-punc">: </span>
          <span className="tok-str">&quot;all&quot;</span>
          <span className="tok-punc">{" }"})</span>
        </>
      ),
    },
    {
      kind: "ok",
      label: (
        <>
          14 tokens · <span className="tok-num">4</span> palette ·{" "}
          <span className="tok-num">2</span> fonts · <span className="tok-num">6</span> radii
        </>
      ),
    },
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.synthesize</span>
          <span className="tok-punc">()</span>
        </>
      ),
    },
    {
      kind: "ok",
      label: (
        <>
          wrote <span className="tok-str">design.md</span> ·{" "}
          <span className="tok-num">9</span> sections ·{" "}
          <span className="tok-num">14.3KB</span>
        </>
      ),
    },
  ];
}

export default function InteractiveDemo() {
  const [siteId, setSiteId] = useState<string>(SITES[0].id);
  const site = useMemo(() => SITES.find((s) => s.id === siteId)!, [siteId]);
  const allSteps = useMemo(() => buildSteps(site), [site]);
  const [visible, setVisible] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const backendScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisible(0);
    if (timer.current) clearTimeout(timer.current);
    const tick = (i: number) => {
      setVisible(i);
      if (i < allSteps.length) {
        timer.current = setTimeout(() => tick(i + 1), 620);
      }
    };
    timer.current = setTimeout(() => tick(1), 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [allSteps]);

  // Auto-scroll both panels to the bottom as content streams in
  useEffect(() => {
    const opts: ScrollToOptions = { top: 1e9, behavior: "smooth" };
    chatScrollRef.current?.scrollTo(opts);
    backendScrollRef.current?.scrollTo(opts);
  }, [visible]);

  const done = visible >= allSteps.length;

  return (
    <div className="grid items-stretch gap-5 lg:h-[560px] lg:grid-cols-[1.15fr_1fr]">
      {/* LEFT — mock browser */}
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-100)]">
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-200)] px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-center text-[11.5px] text-[var(--subtle)] font-mono">
            getdesign.app
          </div>
          <div className="w-[52px]" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[180px_1fr]">
          {/* site picker */}
          <div className="overflow-y-auto border-r border-[var(--border)] p-3">
            <div className="px-1 pb-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              Try a URL
            </div>
            <div className="flex flex-col gap-1">
              {SITES.map((s) => {
                const active = s.id === siteId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSiteId(s.id)}
                    className={`group flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                      active
                        ? "border-[var(--border-strong)] bg-[var(--surface-200)] text-foreground"
                        : "border-transparent text-muted hover:bg-[var(--surface-200)] hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-[4px] text-[10px] font-medium ${
                        active
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--surface-300)] text-muted"
                      }`}
                    >
                      {s.favicon}
                    </span>
                    <span className="font-mono">{s.url}</span>
                  </button>
                );
              })}
              <div className="mt-2 rounded-md border border-dashed border-[var(--border-strong)] px-2.5 py-2 text-[11.5px] text-[var(--subtle)]">
                or paste any URL…
              </div>
            </div>

            <div className="mt-5 px-1 pb-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              Surfaces
            </div>
            <div className="flex flex-col gap-1 px-1 text-[12px] text-muted">
              <div>— web</div>
              <div>— api</div>
              <div>— cli</div>
              <div>— sdk</div>
            </div>
          </div>

          {/* chat/preview panel */}
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    done ? "bg-[var(--accent)]" : "bg-[var(--accent)] pulse-dot"
                  }`}
                />
                <span className="text-muted">
                  {done ? "ready" : "extracting"}
                </span>
                <span className="text-[var(--subtle)]">·</span>
                <span className="font-mono text-[var(--subtle)]">
                  {site.url}
                </span>
              </div>
              <span className="text-[11px] text-[var(--subtle)]">
                design.md
              </span>
            </div>

            <div
              ref={chatScrollRef}
              className="code-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[13px]"
            >
              {/* user bubble */}
              <div className="fade-in-up flex justify-end">
                <div className="max-w-[78%] rounded-lg rounded-br-sm border border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-foreground">
                  Extract the design system from{" "}
                  <span className="font-mono text-[var(--accent)]">
                    {site.url}
                  </span>
                </div>
              </div>

              {/* assistant bubble — theme */}
              {visible >= 2 && (
                <div className="fade-in-up flex justify-start">
                  <div className="max-w-[86%] rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2.5 text-muted">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--subtle)]">
                      ## Visual Theme
                    </div>
                    <div className="mt-1.5 text-foreground">{site.theme}.</div>
                  </div>
                </div>
              )}

              {/* palette */}
              {visible >= 5 && (
                <div className="fade-in-up flex justify-start">
                  <div className="max-w-[86%] rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2.5 text-muted">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--subtle)]">
                      ## Palette
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {site.palette.map((c) => (
                        <div
                          key={c}
                          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-200)] px-1.5 py-1 font-mono text-[11px] text-muted"
                        >
                          <span
                            className="h-3 w-3 rounded-[3px] border border-[var(--border-strong)]"
                            style={{ background: c }}
                          />
                          {c}
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
              )}

              {/* sections list */}
              {done && (
                <div className="fade-in-up flex justify-start">
                  <div className="max-w-[86%] rounded-lg rounded-bl-sm border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2.5 text-muted">
                    <div className="text-foreground">
                      design.md ready —{" "}
                      <span className="text-[var(--accent)]">9 sections</span>,
                      grounded in actual CSS.
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[var(--subtle)]">
                      {site.sections.join(" · ")} · +5 more
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* mini input */}
            <div className="border-t border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-[12.5px]">
                <span className="text-[var(--accent)]">›</span>
                <span className="text-[var(--subtle)]">
                  ask a follow-up about {site.url}…
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-[var(--subtle)]">
                  {visible}/{allSteps.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — backend trace */}
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
          ref={backendScrollRef}
          className="code-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed"
        >
          {allSteps.slice(0, visible).map((step, i) => (
            <div key={`${site.id}-${i}`} className="fade-in-up flex gap-2">
              <span className="mt-[3px] shrink-0">
                {step.kind === "call" && (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[var(--border-strong)] bg-[var(--surface-200)] text-[9px] text-[var(--accent)]">
                    ▶
                  </span>
                )}
                {step.kind === "ok" && (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] text-[var(--accent)]">
                    ✓
                  </span>
                )}
                {step.kind === "info" && (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] text-muted">
                    ◦
                  </span>
                )}
                {step.kind === "err" && (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] text-[var(--danger)]">
                    ×
                  </span>
                )}
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

        {/* status bar pinned to bottom so the panel never resizes */}
        <div className="border-t border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-[11.5px]">
          {done ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-muted">
                <span className="tok-num">200</span> OK ·{" "}
                <span className="tok-num">8.2s</span> · 14.3KB
              </span>
              <button
                onClick={() => {
                  // replay the stream
                  setVisible(0);
                  if (timer.current) clearTimeout(timer.current);
                  const tick = (i: number) => {
                    setVisible(i);
                    if (i < allSteps.length) {
                      timer.current = setTimeout(() => tick(i + 1), 620);
                    }
                  };
                  timer.current = setTimeout(() => tick(1), 200);
                }}
                className="text-[var(--accent)] hover:underline underline-offset-4"
              >
                replay ↻
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--subtle)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
              <span className="font-mono">
                thinking<span className="caret" />
              </span>
              <span className="ml-auto font-mono text-[10.5px]">
                {visible}/{allSteps.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
