"use client";

import { useState } from "react";

const INSTALL_CMD = "npx skills add MohtashamMurshid/getdesign";

type SkillInstallCommandProps = {
  compact?: boolean;
};

export function SkillInstallCommand({
  compact = false,
}: SkillInstallCommandProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard errors (permission denied, insecure context, etc.)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {compact ? null : (
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--subtle)]">
          Install as an agent skill
        </div>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="group flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-200)] px-3.5 py-2.5 text-left font-mono text-[13px] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-300)]"
      >
        <span className="text-[var(--accent)]">$</span>
        <span className="text-foreground">{INSTALL_CMD}</span>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-[3px] text-[10.5px] uppercase tracking-[0.14em] text-[var(--subtle)] group-hover:text-foreground">
          {copied ? "copied" : "copy"}
        </span>
      </button>
    </div>
  );
}
