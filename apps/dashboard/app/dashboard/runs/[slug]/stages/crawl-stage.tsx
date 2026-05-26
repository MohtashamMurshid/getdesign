"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { CrawlSiteResult } from "@getdesign/tools";

import { ScrambleText } from "@/components/scramble-text";

type DerivedHeading = {
  key: string;
  label: string;
  path: string;
};

export function CrawlStage({ crawl }: { crawl: CrawlSiteResult | null }) {
  const headings = useMemo(() => deriveHeadings(crawl), [crawl]);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    // Intentional: animation reset when the source data changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (headings.length === 0) {
      setRevealed(0);
      return;
    }
    let i = 0;
    setRevealed(0);
    /* eslint-enable react-hooks/set-state-in-effect */
    const interval = window.setInterval(() => {
      i = Math.min(i + 1, headings.length);
      setRevealed(i);
      if (i >= headings.length) window.clearInterval(interval);
    }, 220);
    return () => window.clearInterval(interval);
  }, [headings.length]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/15 p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Discovering pages
        </p>
        <span className="ml-auto rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {headings.length} page{headings.length === 1 ? "" : "s"}
        </span>
      </div>

      {crawl?.siteName ? (
        <div className="mb-4">
          <ScrambleText
            text={crawl.siteName}
            duration={650}
            className="text-xl font-semibold tracking-tight text-foreground"
          />
        </div>
      ) : (
        <div className="mb-4 h-6 w-1/2 animate-pulse rounded-md bg-muted" />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {headings.slice(0, revealed).map((h, i) => (
              <motion.li
                key={h.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-baseline gap-3"
              >
                <span className="w-6 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <ScrambleText
                    text={h.label}
                    duration={520}
                    startDelay={80}
                    className="block truncate text-sm font-medium text-foreground"
                  />
                  <ScrambleText
                    text={h.path}
                    duration={520}
                    startDelay={140}
                    className="block truncate font-mono text-[10px] text-muted-foreground"
                  />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>

          {headings.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={`shimmer-${i}`} className="flex items-baseline gap-3">
                  <span className="w-6 shrink-0 font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
                  </div>
                </li>
              ))
            : null}
        </ul>
      </div>
    </div>
  );
}

/**
 * The crawler returns flat URLs (no per-page headings). We derive a readable
 * label from each URL's path, plus the seed at the top, so something
 * meaningful scrambles into shape.
 */
function deriveHeadings(crawl: CrawlSiteResult | null): DerivedHeading[] {
  if (!crawl) return [];
  const seen = new Set<string>();
  const result: DerivedHeading[] = [];

  const candidates: string[] = [];
  if (crawl.sourceUrl) candidates.push(crawl.sourceUrl);
  for (const u of crawl.sourceUrls ?? []) candidates.push(u);

  for (const raw of candidates) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(parsed.protocol)) continue;
    // Skip stylesheet / asset URLs — we only want navigable pages.
    if (/\.(css|js|mjs|map|svg|png|jpe?g|gif|webp|ico|woff2?|ttf)$/i.test(parsed.pathname)) {
      continue;
    }
    const key = `${parsed.host}${parsed.pathname}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const label = labelFromPath(parsed.pathname) || parsed.host.replace(/^www\./, "");
    const shortPath =
      parsed.pathname === "/" || parsed.pathname === ""
        ? parsed.host.replace(/^www\./, "")
        : `${parsed.host.replace(/^www\./, "")}${parsed.pathname}`;

    result.push({ key, label, path: shortPath });
    if (result.length >= 12) break;
  }
  return result;
}

function labelFromPath(pathname: string): string {
  if (!pathname || pathname === "/") return "Home";
  const segments = pathname
    .split("/")
    .map((s) => decodeURIComponent(s))
    .filter(Boolean);
  if (segments.length === 0) return "Home";
  return segments
    .map((s) => titleize(s.replace(/[-_]+/g, " ")))
    .join(" · ");
}

function titleize(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
