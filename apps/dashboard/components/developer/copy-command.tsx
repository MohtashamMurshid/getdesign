"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type CopyCommandProps = {
  command: string;
  label?: string;
  className?: string;
};

export function CopyCommand({ command, label, className }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleCopy}
        className="group flex w-full items-start gap-3 rounded-lg border bg-muted/40 px-3.5 py-2.5 text-left font-mono text-[13px] transition-colors hover:bg-muted"
      >
        <span className="shrink-0 text-muted-foreground">$</span>
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-all text-foreground">
          {command}
        </span>
        <span className="shrink-0 rounded-md border bg-background px-2 py-[3px] text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-foreground">
          {copied ? "copied" : "copy"}
        </span>
      </button>
    </div>
  );
}
