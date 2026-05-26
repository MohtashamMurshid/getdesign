"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { DesignTokens } from "@getdesign/types";

type Swatch = { hex: string; role: string };
type FontSample = { family: string; size: string; role: string };

const SWATCH_SIZE = 44;

export function ExtractStage({ tokens }: { tokens: DesignTokens | null }) {
  const swatches = useMemo(() => collectSwatches(tokens), [tokens]);
  const fonts = useMemo(() => collectFonts(tokens), [tokens]);

  // Stable random scatter positions per hex; recomputed only when the set
  // of colors changes. Coordinates are in % of canvas.
  const scatter = useMemo(() => buildScatter(swatches), [swatches]);

  const [phase, setPhase] = useState<"scattering" | "settled">("scattering");
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    // Intentional: animation resets when the source swatches change.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (swatches.length === 0) {
      setRevealed(0);
      setPhase("scattering");
      return;
    }
    setRevealed(0);
    setPhase("scattering");
    /* eslint-enable react-hooks/set-state-in-effect */

    let i = 0;
    const popper = window.setInterval(() => {
      i = Math.min(i + 1, swatches.length);
      setRevealed(i);
      if (i >= swatches.length) {
        window.clearInterval(popper);
        // Hold the chaotic constellation for a beat, then settle.
        window.setTimeout(() => setPhase("settled"), 900);
      }
    }, 110);

    return () => window.clearInterval(popper);
  }, [swatches.length]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/15">
      <div className="flex items-center gap-2 px-6 pt-6">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Extracting tokens
        </p>
        <span className="ml-auto rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {swatches.length} color{swatches.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Canvas: scatter when popping, then settle into a row at the bottom */}
      <div className="relative min-h-0 flex-1">
        {phase === "scattering" ? (
          <AnimatePresence>
            {swatches.slice(0, revealed).map((s, i) => {
              const pos = scatter[i] ?? { x: 50, y: 50, rot: 0 };
              return (
                <motion.div
                  key={`scatter-${s.hex}-${i}`}
                  layoutId={`swatch-${s.hex}-${i}`}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1, rotate: pos.rot }}
                  transition={{
                    type: "spring",
                    stiffness: 360,
                    damping: 18,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                >
                  <div
                    className="rounded-md border border-border/60 shadow-md"
                    style={{
                      backgroundColor: s.hex,
                      width: SWATCH_SIZE,
                      height: SWATCH_SIZE,
                    }}
                    title={`${s.hex} · ${s.role}`}
                  />
                  <div className="mt-1 text-center font-mono text-[9px] text-muted-foreground">
                    {s.hex}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : null}

        {phase === "settled" ? (
          <div className="absolute inset-0 flex flex-col justify-end gap-4 px-6 pb-6">
            <Section title="Palette">
              <div className="flex flex-wrap gap-1.5">
                {swatches.map((s, i) => (
                  <motion.div
                    key={`grid-${s.hex}-${i}`}
                    layoutId={`swatch-${s.hex}-${i}`}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 28,
                    }}
                    className="size-7 rounded-md border border-border/60 shadow-sm"
                    style={{ backgroundColor: s.hex }}
                    title={`${s.hex} · ${s.role}`}
                  />
                ))}
              </div>
            </Section>

            <Section title="Typography">
              <div className="space-y-1.5">
                {fonts.length === 0
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={`type-skel-${i}`}
                        className="h-5 w-2/3 animate-pulse rounded bg-muted"
                      />
                    ))
                  : fonts.map((f, i) => (
                      <motion.div
                        key={`${f.family}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-baseline gap-2"
                      >
                        <span
                          className="truncate text-foreground"
                          style={{
                            fontSize: f.size,
                            fontFamily: safeFontStack(f.family),
                          }}
                        >
                          {f.family}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {f.role}
                        </span>
                      </motion.div>
                    ))}
              </div>
            </Section>
          </div>
        ) : null}
      </div>
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-lg border bg-card/70 p-3 shadow-sm"
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </motion.div>
  );
}

function buildScatter(swatches: Swatch[]) {
  // Deterministic pseudo-random based on hex so positions are stable per render
  // (avoids re-shuffling when the parent re-renders). Margins keep chips off
  // the edges and out of the top label area.
  return swatches.map((s, i) => {
    const seed = hashSeed(`${s.hex}-${i}`);
    const x = 12 + (seed.r1 * 76); // 12..88%
    const y = 18 + (seed.r2 * 60); // 18..78%
    const rot = (seed.r3 - 0.5) * 16;
    return { x, y, rot };
  });
}

function hashSeed(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r1 = (((h >>> 0) % 1000) / 1000);
  const r2 = ((((h * 7) >>> 0) % 1000) / 1000);
  const r3 = ((((h * 13) >>> 0) % 1000) / 1000);
  return { r1, r2, r3 };
}

function collectSwatches(tokens: DesignTokens | null): Swatch[] {
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
  const result: Swatch[] = [];
  for (const c of all) {
    const key = c.hex.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ hex: c.hex, role: c.role });
    if (result.length >= 18) break;
  }
  return result;
}

function collectFonts(tokens: DesignTokens | null): FontSample[] {
  if (!tokens) return [];
  const seen = new Set<string>();
  const out: FontSample[] = [];
  const sizes = ["22px", "16px", "13px"];
  let i = 0;
  for (const f of tokens.typography.fontFamilies) {
    if (f.family.startsWith("var(") || f.family === "inherit") continue;
    if (seen.has(f.family)) continue;
    seen.add(f.family);
    out.push({ family: f.family, size: sizes[i % sizes.length]!, role: f.role });
    i += 1;
    if (out.length >= 3) break;
  }
  return out;
}

function safeFontStack(family: string): string {
  if (/[\s-]/.test(family) && !/['",]/.test(family)) {
    return `"${family}", system-ui, sans-serif`;
  }
  return `${family}, system-ui, sans-serif`;
}
