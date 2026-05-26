"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BrowserWindow({
  url,
  substatus,
  children,
  tone = "default",
}: {
  url: string;
  substatus?: string;
  children: ReactNode;
  tone?: "default" | "error";
}) {
  const host = safeHost(url);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
        tone === "error" && "border-destructive/40",
      )}
    >
      <div className="flex h-9 items-center gap-3 border-b bg-muted/40 px-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-2.5 py-1">
          <LockIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80">
            {host}
          </span>
          <span
            className={cn(
              "shrink-0 truncate text-xs",
              tone === "error" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {substatus ?? ""}
          </span>
        </div>
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
}

function safeHost(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
      <path d="M4 5.5V3.75a2 2 0 0 1 4 0V5.5" />
    </svg>
  );
}
