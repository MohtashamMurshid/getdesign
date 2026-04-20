"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BackendTrace } from "./backend-trace";
import { buildSteps, CHROME_LABELS, SITES, SURFACES } from "./constants";
import { PreviewPanel } from "./preview-panel";
import type { Surface } from "./types";
import { useDemoPlayback } from "./use-demo-playback";

export default function InteractiveDemo() {
  const [siteId, setSiteId] = useState<string>(SITES[0].id);
  const [surface, setSurface] = useState<Surface>("web");

  const site = useMemo(() => SITES.find((entry) => entry.id === siteId)!, [siteId]);
  const steps = useMemo(() => buildSteps(site), [site]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const backendScrollRef = useRef<HTMLDivElement | null>(null);

  const { visibleSteps, done, restart } = useDemoPlayback({
    totalSteps: steps.length,
  });

  useEffect(() => {
    restart();
    // Replay the agent trace whenever the user switches site or surface.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, surface]);

  useEffect(() => {
    const scrollOptions: ScrollToOptions = {
      top: Number.MAX_SAFE_INTEGER,
      behavior: "smooth",
    };

    chatScrollRef.current?.scrollTo(scrollOptions);
    backendScrollRef.current?.scrollTo(scrollOptions);
  }, [visibleSteps]);

  const chromeLabel =
    surface === "api"
      ? CHROME_LABELS.api.replace("{url}", site.url)
      : CHROME_LABELS[surface];

  return (
    <div className="grid items-stretch gap-5 lg:h-[560px] lg:grid-cols-[1.7fr_1fr]">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-100)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-200)] px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-center font-mono text-[11.5px] text-[var(--subtle)]">
            {chromeLabel}
          </div>
          <div className="w-[52px] text-right font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            {surface}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[180px_1fr]">
          <div className="overflow-y-auto border-r border-[var(--border)] p-3">
            <div className="px-1 pb-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              Try a URL
            </div>
            <div className="flex flex-col gap-1">
              {SITES.map((entry) => {
                const isActive = entry.id === siteId;

                return (
                  <button
                    key={entry.id}
                    onClick={() => setSiteId(entry.id)}
                    className={`group flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                      isActive
                        ? "border-[var(--border-strong)] bg-[var(--surface-200)] text-foreground"
                        : "border-transparent text-muted hover:bg-[var(--surface-200)] hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] p-[3px] transition-colors"
                      style={{
                        color: entry.brandColor,
                        backgroundColor: isActive
                          ? `color-mix(in srgb, ${entry.brandColor} 18%, transparent)`
                          : "var(--surface-300)",
                      }}
                    >
                      {entry.favicon}
                    </span>
                    <span className="font-mono">{entry.url}</span>
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
            <div className="flex flex-col gap-1">
              {SURFACES.map((entry) => {
                const isActive = entry.id === surface;

                return (
                  <button
                    key={entry.id}
                    onClick={() => setSurface(entry.id)}
                    className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                      isActive
                        ? "border-[var(--border-strong)] bg-[var(--surface-200)] text-foreground"
                        : "border-transparent text-muted hover:bg-[var(--surface-200)] hover:text-foreground"
                    }`}
                  >
                    <span className="font-mono">— {entry.label}</span>
                    {isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <PreviewPanel
            site={site}
            surface={surface}
            visibleSteps={visibleSteps}
            totalSteps={steps.length}
            done={done}
            scrollRef={chatScrollRef}
          />
        </div>
      </div>

      <BackendTrace
        steps={steps}
        visibleSteps={visibleSteps}
        done={done}
        scrollRef={backendScrollRef}
        onReplay={restart}
      />
    </div>
  );
}
