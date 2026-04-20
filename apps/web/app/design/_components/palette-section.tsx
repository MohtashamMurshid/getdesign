"use client";

import { useEffect, useState } from "react";

import { PALETTE } from "./design-data";

export function PaletteSection() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {PALETTE.map((color) => (
        <Swatch key={color.cssVar} {...color} />
      ))}
    </div>
  );
}

type SwatchProps = (typeof PALETTE)[number];

function Swatch({ name, cssVar, fallback, role }: SwatchProps) {
  const { copiedValue, copy } = useCopy();
  const copyValue = `var(${cssVar})`;
  const textTone =
    cssVar === "--accent" ||
    cssVar === "--accent-dim" ||
    cssVar === "--foreground"
      ? "dark"
      : "light";

  return (
    <button
      type="button"
      onClick={() => copy(copyValue)}
      className="group relative flex flex-col bg-[var(--surface-100)] p-5 text-left transition-colors hover:bg-[var(--surface-200)]"
    >
      <div
        className="relative h-20 overflow-hidden rounded-md border border-[var(--border)]"
        style={{ background: `var(${cssVar}, ${fallback})` }}
      >
        <span
          className={`absolute bottom-2 right-2 font-mono text-[10px] ${
            textTone === "dark" ? "text-[#0a0a0b]/70" : "text-[var(--subtle)]"
          }`}
        >
          {fallback}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13px] text-foreground">{name}</span>
        <span className="font-mono text-[10.5px] text-[var(--subtle)] transition-colors group-hover:text-[var(--accent)]">
          {copiedValue === copyValue ? "copied" : "copy"}
        </span>
      </div>
      <span className="mt-1 font-mono text-[11px] text-[var(--accent)]">
        {cssVar}
      </span>
      <span className="mt-1 text-[11.5px] text-muted">{role}</span>
    </button>
  );
}

function useCopy() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedValue) {
      return;
    }

    const timeout = setTimeout(() => setCopiedValue(null), 1200);
    return () => clearTimeout(timeout);
  }, [copiedValue]);

  return {
    copiedValue,
    copy: async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedValue(value);
      } catch {
        // Clipboard access is optional in this demo surface.
      }
    },
  };
}
