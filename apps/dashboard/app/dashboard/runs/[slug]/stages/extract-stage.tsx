"use client";

import { useEffect, useMemo, useState } from "react";

import type { DesignTokens } from "@getdesign/types";

export function ExtractStage({ tokens }: { tokens: DesignTokens | null }) {
  const swatches = useMemo(() => collectSwatches(tokens), [tokens]);
  const fontSamples = useMemo(() => collectFonts(tokens), [tokens]);
  const spacing = useMemo(() => collectSpacing(tokens), [tokens]);
  const radii = useMemo(() => collectRadii(tokens), [tokens]);

  const [revealedSwatches, setRevealedSwatches] = useState(0);

  useEffect(() => {
    if (swatches.length === 0) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = Math.min(i + 1, swatches.length);
      setRevealedSwatches(i);
      if (i >= swatches.length) window.clearInterval(interval);
    }, 70);
    return () => window.clearInterval(interval);
  }, [swatches.length]);

  return (
    <div className="grid h-full w-full grid-cols-2 gap-4 p-6">
      <Section title="Colors">
        <div className="flex flex-wrap gap-1.5">
          {swatches.length === 0
            ? Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`swatch-skel-${i}`}
                  className="size-7 animate-pulse rounded-md bg-muted"
                />
              ))
            : swatches.slice(0, revealedSwatches).map((s, i) => (
                <div
                  key={`${s.hex}-${i}`}
                  className="size-7 rounded-md border border-border/60 shadow-sm [animation:chipIn_320ms_ease-out_both]"
                  style={{ backgroundColor: s.hex }}
                  title={`${s.hex} · ${s.role}`}
                />
              ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          {fontSamples.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`type-skel-${i}`}
                  className="h-6 animate-pulse rounded-md bg-muted"
                />
              ))
            : fontSamples.map((f, i) => (
                <div
                  key={`${f.family}-${i}`}
                  className="flex items-baseline gap-2 [animation:chipIn_320ms_ease-out_both]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span
                    className="truncate text-foreground"
                    style={{ fontSize: f.size, fontFamily: safeFontStack(f.family) }}
                  >
                    {f.family}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {f.role}
                  </span>
                </div>
              ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div className="flex flex-wrap items-end gap-1.5">
          {spacing.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`spc-skel-${i}`}
                  className="h-4 w-6 animate-pulse rounded-sm bg-muted"
                />
              ))
            : spacing.map((s, i) => (
                <div
                  key={`${s.value}-${i}`}
                  className="flex flex-col items-center gap-0.5 [animation:chipIn_320ms_ease-out_both]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className="rounded-sm bg-foreground/80"
                    style={{
                      width: `${Math.min(48, Math.max(4, s.px))}px`,
                      height: "10px",
                    }}
                  />
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {s.value}
                  </span>
                </div>
              ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap items-center gap-2">
          {radii.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`rad-skel-${i}`}
                  className="size-7 animate-pulse rounded-md bg-muted"
                />
              ))
            : radii.map((r, i) => (
                <div
                  key={`${r.value}-${i}`}
                  className="flex flex-col items-center gap-0.5 [animation:chipIn_320ms_ease-out_both]"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div
                    className="size-7 border bg-foreground/10"
                    style={{ borderRadius: r.value }}
                  />
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {r.value}
                  </span>
                </div>
              ))}
        </div>
      </Section>

      <style jsx>{`
        @keyframes chipIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 overflow-hidden rounded-lg border bg-card/60 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function collectSwatches(tokens: DesignTokens | null) {
  if (!tokens) return [];
  const groups = [
    tokens.colors.primary,
    tokens.colors.accent,
    tokens.colors.neutral,
    tokens.colors.surfaces,
    tokens.colors.borders,
  ];
  const all = groups.flat();
  const seen = new Set<string>();
  const result: { hex: string; role: string }[] = [];
  for (const c of all) {
    const key = normalizeHex(c.hex);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ hex: c.hex, role: c.role });
    if (result.length >= 36) break;
  }
  return result;
}

function normalizeHex(hex: string) {
  return hex.toLowerCase();
}

function collectFonts(tokens: DesignTokens | null) {
  if (!tokens) return [];
  const seen = new Set<string>();
  const samples: { family: string; size: string; role: string }[] = [];
  const sizes = ["20px", "14px", "12px"];
  let i = 0;
  for (const f of tokens.typography.fontFamilies) {
    if (f.family.startsWith("var(") || f.family === "inherit") continue;
    if (seen.has(f.family)) continue;
    seen.add(f.family);
    samples.push({ family: f.family, size: sizes[i % sizes.length], role: f.role });
    i += 1;
    if (samples.length >= 3) break;
  }
  return samples;
}

function collectSpacing(tokens: DesignTokens | null) {
  if (!tokens) return [];
  const seen = new Set<string>();
  const out: { value: string; px: number }[] = [];
  for (const s of tokens.spacing) {
    const px = parsePx(s.value);
    if (!Number.isFinite(px) || px <= 0 || px > 96) continue;
    if (seen.has(s.value)) continue;
    seen.add(s.value);
    out.push({ value: s.value, px });
    if (out.length >= 10) break;
  }
  return out.sort((a, b) => a.px - b.px);
}

function parsePx(value: string): number {
  const trimmed = value.trim();
  const match = /^([-]?[0-9]*\.?[0-9]+)(px|rem|em)?$/.exec(trimmed);
  if (!match) return Number.NaN;
  const num = parseFloat(match[1]!);
  const unit = match[2] ?? "px";
  if (unit === "rem" || unit === "em") return num * 16;
  return num;
}

function collectRadii(tokens: DesignTokens | null) {
  if (!tokens) return [];
  const out: { value: string }[] = [];
  const seen = new Set<string>();
  for (const r of tokens.radii) {
    if (seen.has(r.value)) continue;
    seen.add(r.value);
    if (r.value === "9999px") continue;
    out.push({ value: r.value });
    if (out.length >= 6) break;
  }
  return out;
}

function safeFontStack(family: string): string {
  if (/[\s\-]/.test(family) && !/['",]/.test(family)) {
    return `"${family}", system-ui, sans-serif`;
  }
  return `${family}, system-ui, sans-serif`;
}
