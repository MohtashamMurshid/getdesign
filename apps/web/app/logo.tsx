"use client";

import { useEffect, useRef } from "react";

/**
 * getdesign logo system.
 *
 * Concept: the product returns a design.md, so the mark IS that artifact —
 * lowercase "md" hugged by geometric square brackets: `[md]`.
 * Brackets render in currentColor. "md" renders in the accent, in JetBrains
 * Mono, reinforcing the terminal/agent identity of the product.
 *
 * Variants:
 *  - mark      : glyph only
 *  - lockup    : mark + split wordmark ("get" subtle, "design" foreground)
 *  - wordmark  : wordmark only
 *  - mono      : glyph fully in currentColor (no accent) — OG / print
 *  - animated  : lockup with a subtle draw-on of the brackets + md fade
 */

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "mark" | "lockup" | "wordmark" | "mono" | "animated";

const SIZE_MAP: Record<
  LogoSize,
  { mark: number; gap: string; word: string }
> = {
  sm: { mark: 22, gap: "gap-1.5", word: "text-[13px]" },
  md: { mark: 26, gap: "gap-2", word: "text-[14px]" },
  lg: { mark: 34, gap: "gap-2.5", word: "text-[17px]" },
  xl: { mark: 72, gap: "gap-4", word: "text-[36px]" },
};

export function Logo({
  variant = "lockup",
  size = "md",
  className = "",
  title = "getdesign",
}: {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  title?: string;
}) {
  const s = SIZE_MAP[size];

  const markNode = (
    <Mark
      size={s.mark}
      mono={variant === "mono"}
      animated={variant === "animated"}
      title={variant === "mark" || variant === "mono" ? title : undefined}
    />
  );

  if (variant === "mark" || variant === "mono") {
    return <span className={className}>{markNode}</span>;
  }

  if (variant === "wordmark") {
    return (
      <span
        className={`inline-flex items-baseline font-medium tracking-tight ${s.word} ${className}`}
        aria-label={title}
      >
        <Wordmark />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${className}`}
      aria-label={title}
    >
      {markNode}
      <span
        className={`inline-flex items-baseline font-medium tracking-tight ${s.word}`}
        aria-hidden
      >
        <Wordmark />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Mark — [md]                                                         */
/* ------------------------------------------------------------------ */

export function Mark({
  size = 26,
  mono,
  animated,
  title,
}: {
  size?: number;
  mono?: boolean;
  animated?: boolean;
  title?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!animated || !ref.current) return;
    const node = ref.current;
    node.classList.remove("gd-logo-animate");
    void node.getBoundingClientRect();
    node.classList.add("gd-logo-animate");
  }, [animated]);

  const height = size;
  // 60×40 viewBox → ratio 1.5. Small enough to feel like a mark, wide enough
  // for the "md" to breathe between the brackets.
  const width = Math.round(size * 1.5);
  const mdColor = mono ? "currentColor" : "var(--accent)";

  return (
    <svg
      ref={ref}
      viewBox="0 0 60 40"
      width={width}
      height={height}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={!title}
      className={animated ? "gd-logo" : undefined}
      shapeRendering="geometricPrecision"
    >
      {/* left bracket [ */}
      <path
        className="gd-bracket gd-bracket-l"
        d="M11 5 L4 5 L4 35 L11 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* right bracket ] */}
      <path
        className="gd-bracket gd-bracket-r"
        d="M49 5 L56 5 L56 35 L49 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* md */}
      <text
        className="gd-md"
        x="30"
        y="28"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="20"
        fontWeight={600}
        letterSpacing="-1"
        fill={mdColor}
      >
        md
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Wordmark — "get" subtle + "design" foreground                      */
/* ------------------------------------------------------------------ */

function Wordmark() {
  return (
    <>
      <span className="text-[var(--subtle)]">get</span>
      <span className="text-foreground">design</span>
    </>
  );
}

export default Logo;
