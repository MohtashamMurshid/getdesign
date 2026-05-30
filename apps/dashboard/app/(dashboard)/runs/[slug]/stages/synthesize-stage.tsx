"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { DesignDoc, DesignTokens } from "@getdesign/types";
import type { StoredVisual } from "@/lib/runs-store";
import { tileUrl } from "../use-run-artifacts";

type ParticleKind = "color" | "type" | "tile";

type Particle = {
  id: string;
  kind: ParticleKind;
  /** start position in % */
  fromX: number;
  fromY: number;
  /** payload for rendering */
  hex?: string;
  family?: string;
  imageUrl?: string;
  delay: number;
};

const FLY_DURATION_MS = 900;

export function SynthesizeStage({
  doc,
  tokens,
  visual,
}: {
  doc: DesignDoc | null;
  tokens: DesignTokens | null;
  visual: StoredVisual | null;
}) {
  const particles = useMemo(
    () => buildParticles({ tokens, visual }),
    [tokens, visual],
  );
  const [phase, setPhase] = useState<"flying" | "stitched">("flying");
  const [outlineLines, setOutlineLines] = useState(0);

  useEffect(() => {
    // Intentional: animation resets when the source particles change.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPhase("flying");
    setOutlineLines(0);
    if (particles.length === 0) {
      setPhase("stitched");
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const flyEnd = window.setTimeout(() => {
      setPhase("stitched");
    }, FLY_DURATION_MS + 250);
    return () => window.clearTimeout(flyEnd);
  }, [particles]);

  useEffect(() => {
    if (phase !== "stitched") return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = Math.min(i + 1, OUTLINE.length);
      setOutlineLines(i);
      if (i >= OUTLINE.length) window.clearInterval(interval);
    }, 200);
    return () => window.clearInterval(interval);
  }, [phase]);

  const siteCaption = doc?.siteName ?? tokens?.siteName ?? "Composing…";

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/15">
      <div className="flex items-center gap-2 px-6 pt-6">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Stitching the spec
        </p>
        <span className="ml-auto rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {siteCaption}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        {/* Center target — the doc that gets stitched together */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-[280px] rounded-lg border bg-background p-4 shadow-md"
          >
            <div className="mb-3 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#ff5f57]" />
              <span className="size-2 rounded-full bg-[#febc2e]" />
              <span className="size-2 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                design.md
              </span>
            </div>
            <div className="space-y-1.5">
              {OUTLINE.map((line, i) => (
                <motion.div
                  key={`outline-${i}`}
                  initial={{ opacity: 0.2, width: 0 }}
                  animate={{
                    opacity: i < outlineLines ? 1 : 0.2,
                    width: i < outlineLines ? line.width : "20%",
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={
                    line.heading
                      ? "h-3 rounded-sm bg-foreground/80"
                      : "h-2 rounded-sm bg-foreground/30"
                  }
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Flying particles converge from edges into the center card */}
        <AnimatePresence>
          {phase === "flying"
            ? particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{
                    left: `${p.fromX}%`,
                    top: `${p.fromY}%`,
                    opacity: 0,
                    scale: 0.6,
                  }}
                  animate={{
                    left: "50%",
                    top: "50%",
                    opacity: [0, 1, 1, 0],
                    scale: [0.6, 1, 1, 0.4],
                  }}
                  transition={{
                    duration: FLY_DURATION_MS / 1000,
                    delay: p.delay / 1000,
                    times: [0, 0.2, 0.8, 1],
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <ParticleVisual particle={p} />
                </motion.div>
              ))
            : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ParticleVisual({ particle }: { particle: Particle }) {
  if (particle.kind === "color" && particle.hex) {
    return (
      <div
        className="size-5 rounded-md border border-border/60 shadow-sm"
        style={{ backgroundColor: particle.hex }}
      />
    );
  }
  if (particle.kind === "type" && particle.family) {
    return (
      <span
        className="rounded border bg-background px-1.5 py-0.5 text-[11px] font-medium text-foreground shadow-sm"
        style={{
          fontFamily: safeFontStack(particle.family),
        }}
      >
        Aa
      </span>
    );
  }
  if (particle.kind === "tile" && particle.imageUrl) {
    return (
      <div className="overflow-hidden rounded-sm border border-border/60 shadow-sm">
        <img
          src={particle.imageUrl}
          alt=""
          className="block h-8 w-12 object-cover"
        />
      </div>
    );
  }
  return null;
}

function buildParticles({
  tokens,
  visual,
}: {
  tokens: DesignTokens | null;
  visual: StoredVisual | null;
}): Particle[] {
  const particles: Particle[] = [];

  // Colors
  if (tokens) {
    const colors = [
      ...tokens.colors.primary,
      ...tokens.colors.accent,
      ...tokens.colors.surfaces,
    ];
    const seen = new Set<string>();
    let i = 0;
    for (const c of colors) {
      const key = c.hex.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      particles.push({
        id: `color-${key}-${i}`,
        kind: "color",
        ...edgePoint(i, "color"),
        hex: c.hex,
        delay: i * 60,
      });
      i += 1;
      if (i >= 8) break;
    }
  }

  // Type specimens
  if (tokens) {
    const seen = new Set<string>();
    let i = 0;
    for (const f of tokens.typography.fontFamilies) {
      if (f.family.startsWith("var(") || f.family === "inherit") continue;
      if (seen.has(f.family)) continue;
      seen.add(f.family);
      particles.push({
        id: `type-${f.family}-${i}`,
        kind: "type",
        ...edgePoint(i, "type"),
        family: f.family,
        delay: 250 + i * 80,
      });
      i += 1;
      if (i >= 3) break;
    }
  }

  // Tile thumbs (use first 4 with URLs)
  const tiles = visual?.tiles ?? [];
  let added = 0;
  for (let i = 0; i < tiles.length && added < 4; i += 1) {
    const url = tileUrl(visual, i);
    if (!url) continue;
    particles.push({
      id: `tile-${i}`,
      kind: "tile",
      ...edgePoint(added, "tile"),
      imageUrl: url,
      delay: 100 + added * 110,
    });
    added += 1;
  }

  return particles;
}

function edgePoint(i: number, kind: ParticleKind) {
  // Distribute starting points around the four edges, deterministic per kind+index.
  const seed = hashSeed(`${kind}-${i}`);
  const side = i % 4;
  if (side === 0) return { fromX: 5 + seed.r1 * 90, fromY: -10 };
  if (side === 1) return { fromX: 110, fromY: 5 + seed.r1 * 90 };
  if (side === 2) return { fromX: 5 + seed.r1 * 90, fromY: 110 };
  return { fromX: -10, fromY: 5 + seed.r1 * 90 };
}

function hashSeed(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r1 = (((h >>> 0) % 1000) / 1000);
  return { r1 };
}

function safeFontStack(family: string): string {
  if (/[\s-]/.test(family) && !/['",]/.test(family)) {
    return `"${family}", system-ui, sans-serif`;
  }
  return `${family}, system-ui, sans-serif`;
}

const OUTLINE: Array<{ heading: boolean; width: string }> = [
  { heading: true, width: "60%" },
  { heading: false, width: "85%" },
  { heading: false, width: "70%" },
  { heading: true, width: "45%" },
  { heading: false, width: "90%" },
  { heading: false, width: "75%" },
  { heading: true, width: "55%" },
  { heading: false, width: "80%" },
  { heading: false, width: "65%" },
];
