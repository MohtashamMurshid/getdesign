"use client";

import { useMemo } from "react";

import type { DesignDoc, DesignTokens } from "@getdesign/types";

export function SynthesizeStage({
  doc,
  tokens,
}: {
  doc: DesignDoc | null;
  tokens: DesignTokens | null;
}) {
  const palette = useMemo(() => derivePalette(doc, tokens), [doc, tokens]);
  const typeHierarchy = doc?.typography.hierarchy ?? [];
  const breakpoints = doc?.responsive.breakpoints ?? [];

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Design spec
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {doc?.siteName ?? tokens?.siteName ?? "Composing…"}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 overflow-hidden">
        <SpecRow title="Palette" cols="col-span-12">
          <div className="flex flex-wrap gap-1.5">
            {palette.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`pal-skel-${i}`}
                    className="h-6 w-16 animate-pulse rounded-md bg-muted"
                  />
                ))
              : palette.map((p, i) => (
                  <div
                    key={`${p.hex}-${i}`}
                    className="flex items-center gap-1.5 rounded-md border bg-background pr-2"
                  >
                    <span
                      className="size-5 rounded-l-[5px] border-r"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="font-mono text-[10px] text-foreground/80">
                      {p.hex}
                    </span>
                  </div>
                ))}
          </div>
        </SpecRow>

        <SpecRow title="Type" cols="col-span-7">
          <div className="space-y-1">
            {typeHierarchy.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`type-skel-${i}`}
                    className="h-4 w-3/4 animate-pulse rounded-md bg-muted"
                  />
                ))
              : typeHierarchy.slice(0, 5).map((t, i) => (
                  <div key={`${t.role}-${i}`} className="flex items-baseline gap-2">
                    <span className="w-16 font-mono text-[9px] uppercase text-muted-foreground">
                      {t.role}
                    </span>
                    <span className="font-mono text-[10px] text-foreground/80">
                      {t.size} / {t.weight}
                    </span>
                  </div>
                ))}
          </div>
        </SpecRow>

        <SpecRow title="Breakpoints" cols="col-span-5">
          <div className="space-y-1">
            {breakpoints.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`bp-skel-${i}`}
                    className="h-4 w-2/3 animate-pulse rounded-md bg-muted"
                  />
                ))
              : breakpoints.slice(0, 4).map((b, i) => (
                  <div key={`${b.name}-${i}`} className="flex items-baseline gap-2">
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {b.name}
                    </span>
                    <span className="font-mono text-[10px] text-foreground/80">
                      ≥ {b.minWidth}
                    </span>
                  </div>
                ))}
          </div>
        </SpecRow>

        <SpecRow title="Voice" cols="col-span-12">
          {doc ? (
            <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
              {doc.visualTheme.overview[0]}
            </p>
          ) : (
            <div className="space-y-1">
              <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded-md bg-muted" />
            </div>
          )}
        </SpecRow>
      </div>
    </div>
  );
}

function SpecRow({
  title,
  cols,
  children,
}: {
  title: string;
  cols: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${cols} flex flex-col gap-2 overflow-hidden rounded-lg border bg-card/60 p-3`}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function derivePalette(
  doc: DesignDoc | null,
  tokens: DesignTokens | null,
): Array<{ hex: string }> {
  if (doc) {
    const seen = new Set<string>();
    const out: { hex: string }[] = [];
    for (const group of doc.palette.groups) {
      for (const entry of group.entries) {
        const key = entry.hex.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ hex: entry.hex });
        if (out.length >= 10) return out;
      }
    }
    return out;
  }
  if (!tokens) return [];
  const all = [
    ...tokens.colors.primary,
    ...tokens.colors.accent,
    ...tokens.colors.surfaces,
  ];
  const seen = new Set<string>();
  const out: { hex: string }[] = [];
  for (const c of all) {
    const key = c.hex.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ hex: c.hex });
    if (out.length >= 10) break;
  }
  return out;
}
