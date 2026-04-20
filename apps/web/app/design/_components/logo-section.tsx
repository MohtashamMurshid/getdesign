"use client";

import { useState } from "react";

import { Logo, Mark } from "@/app/_components/logo";

import { Caption, Rule } from "./design-primitives";

export function LogoSection() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="space-y-8">
      <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
        <LogoTile label="Lockup">
          <Logo size="lg" />
        </LogoTile>
        <LogoTile label="Mark">
          <Mark size={44} />
        </LogoTile>
        <LogoTile label="Wordmark">
          <Logo variant="wordmark" size="lg" />
        </LogoTile>
        <LogoTile label="Mono">
          <span className="text-foreground">
            <Mark size={44} mono />
          </span>
        </LogoTile>
        <LogoTile label="On accent" tone="accent">
          <span className="text-[#0a0a0b]">
            <Mark size={44} mono />
          </span>
        </LogoTile>
        <LogoTile label="On light" tone="light">
          <span className="text-[#0a0a0b]">
            <Logo size="lg" />
          </span>
        </LogoTile>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
        <div className="bg-[var(--surface-100)] p-8">
          <Caption>Animated · hero variant</Caption>
          <div className="mt-6 flex items-center gap-6">
            <div key={replayKey}>
              <Logo variant="animated" size="xl" />
            </div>
            <button
              onClick={() => setReplayKey((value) => value + 1)}
              className="btn-ghost inline-flex h-8 items-center rounded-md px-3 text-[12px]"
            >
              Replay
            </button>
          </div>
        </div>

        <div className="bg-[var(--surface-100)] p-8">
          <Caption>Clear space</Caption>
          <div className="mt-6 flex items-center justify-center rounded-md border border-dashed border-[var(--border-strong)] p-6">
            <div className="relative">
              <span className="pointer-events-none absolute -inset-4 rounded-md border border-dashed border-[var(--accent)]/40" />
              <Logo size="lg" />
            </div>
          </div>
          <p className="mt-4 text-[12px] text-muted">
            Minimum clear space equals the height of the mark on all sides.
          </p>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
        <Rule
          kind="do"
          text="Pair the mark with the split wordmark on primary surfaces."
        />
        <Rule
          kind="dont"
          text="Don't recolor the brackets; they always inherit currentColor."
        />
        <Rule
          kind="do"
          text="Use the mono variant on photography, OG cards, and accent fills."
        />
        <Rule kind="dont" text="Don't stretch, rotate, or add effects to the mark." />
      </div>
    </div>
  );
}

type LogoTileProps = {
  label: string;
  tone?: "dark" | "light" | "accent";
  children: React.ReactNode;
};

function LogoTile({ label, tone = "dark", children }: LogoTileProps) {
  const backgroundClass =
    tone === "light"
      ? "bg-[#ededee]"
      : tone === "accent"
        ? "bg-[var(--accent)]"
        : "bg-[var(--surface-100)]";

  return (
    <div className={`${backgroundClass} flex min-h-[160px] flex-col justify-between p-6`}>
      <Caption tone={tone === "dark" ? "dark" : "inverse"}>{label}</Caption>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
