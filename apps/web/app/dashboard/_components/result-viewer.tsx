"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { DashboardResult } from "./types";

type ResultViewerProps = {
  result: DashboardResult;
};

function deriveHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "site";
  }
}

function safeFilename(host: string): string {
  return host.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase() || "site";
}

export function ResultViewer({ result }: ResultViewerProps) {
  const host = useMemo(() => deriveHostname(result.url), [result.url]);
  const filename = useMemo(() => `${safeFilename(host)}.design.md`, [host]);

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
    };
  }, []);

  const downloadHref = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const blob = new Blob([result.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    return URL.createObjectURL(blob);
  }, [result.markdown]);

  useEffect(() => {
    if (!downloadHref) return;
    return () => URL.revokeObjectURL(downloadHref);
  }, [downloadHref]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard not available; ignore.
    }
  }

  const bytes = useMemo(
    () => new TextEncoder().encode(result.markdown).byteLength,
    [result.markdown],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-100)]">
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-200)] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-center font-mono text-[11.5px] text-[var(--subtle)]">
          {filename}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="btn-ghost inline-flex h-7 items-center rounded-md px-2.5 text-[11.5px]"
          >
            {copied ? "copied ✓" : "copy"}
          </button>
          <a
            href={downloadHref}
            download={filename}
            className="btn-accent inline-flex h-7 items-center rounded-md px-2.5 text-[11.5px] font-medium"
          >
            download
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--subtle)]">
        <span>{result.mode === "visual" ? "visual" : "text-only"}</span>
        <span>·</span>
        <span>{result.tiles} tiles</span>
        <span>·</span>
        <span>{formatBytes(bytes)}</span>
        <span className="ml-auto truncate text-[10.5px] normal-case tracking-normal text-[var(--subtle)]">
          {result.url}
        </span>
      </div>

      <pre className="code-scroll max-h-[640px] overflow-auto bg-[var(--surface-100)] px-5 py-5 font-mono text-[12.5px] leading-relaxed text-foreground">
        <code>{result.markdown}</code>
      </pre>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
