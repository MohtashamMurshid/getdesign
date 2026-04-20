"use client";

import { useEffect, useRef } from "react";

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

type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  title?: string;
};

export function Logo({
  variant = "lockup",
  size = "md",
  className = "",
  title = "getdesign",
}: LogoProps) {
  const dimensions = SIZE_MAP[size];

  const mark = (
    <Mark
      size={dimensions.mark}
      mono={variant === "mono"}
      animated={variant === "animated"}
      title={variant === "mark" || variant === "mono" ? title : undefined}
    />
  );

  if (variant === "mark" || variant === "mono") {
    return <span className={className}>{mark}</span>;
  }

  if (variant === "wordmark") {
    return (
      <span
        className={`inline-flex items-baseline font-medium tracking-tight ${dimensions.word} ${className}`}
        aria-label={title}
      >
        <Wordmark />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${dimensions.gap} ${className}`}
      aria-label={title}
    >
      {mark}
      <span
        className={`inline-flex items-baseline font-medium tracking-tight ${dimensions.word}`}
        aria-hidden
      >
        <Wordmark />
      </span>
    </span>
  );
}

type MarkProps = {
  size?: number;
  mono?: boolean;
  animated?: boolean;
  title?: string;
};

export function Mark({
  size = 26,
  mono,
  animated,
  title,
}: MarkProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!animated || !ref.current) {
      return;
    }

    const node = ref.current;
    node.classList.remove("gd-logo-animate");
    void node.getBoundingClientRect();
    node.classList.add("gd-logo-animate");
  }, [animated]);

  const height = size;
  const width = Math.round(size * 1.5);
  const markColor = mono ? "currentColor" : "var(--accent)";

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
      <path
        className="gd-bracket gd-bracket-l"
        d="M11 5 L4 5 L4 35 L11 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        className="gd-bracket gd-bracket-r"
        d="M49 5 L56 5 L56 35 L49 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <text
        className="gd-md"
        x="30"
        y="28"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="20"
        fontWeight={600}
        letterSpacing="-1"
        fill={markColor}
      >
        md
      </text>
    </svg>
  );
}

function Wordmark() {
  return (
    <>
      <span className="text-[var(--subtle)]">get</span>
      <span className="text-foreground">design</span>
    </>
  );
}
