"use client";

import { useEffect, useState } from "react";

import type { CrawlSiteResult } from "@getdesign/tools";

export function CrawlStage({ crawl }: { crawl: CrawlSiteResult | null }) {
  const sources = crawl?.sourceUrls ?? [];
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (sources.length === 0) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = Math.min(i + 1, sources.length);
      setRevealed(i);
      if (i >= sources.length) window.clearInterval(interval);
    }, 110);
    return () => window.clearInterval(interval);
  }, [sources.length]);

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
        </div>

        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      <div className="hidden w-[44%] shrink-0 border-l bg-muted/30 p-4 md:flex md:flex-col">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Discovered sources
        </p>
        <ul className="mt-2 space-y-1 overflow-hidden font-mono text-[11px] leading-relaxed">
          {sources.slice(0, revealed).map((url) => (
            <li
              key={url}
              className="truncate text-foreground/70 [animation:fadeIn_300ms_ease-out]"
              title={url}
            >
              <span className="mr-1 text-muted-foreground">{">"}</span>
              {shortenUrl(url)}
            </li>
          ))}
          {sources.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={`shimmer-${i}`}>
                  <Skeleton className="h-3 w-full" />
                </li>
              ))
            : null}
        </ul>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(2px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  );
}

function shortenUrl(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.length > 40
      ? `${parsed.pathname.slice(0, 18)}…${parsed.pathname.slice(-18)}`
      : parsed.pathname;
    return `${parsed.host}${path}`;
  } catch {
    return url;
  }
}
