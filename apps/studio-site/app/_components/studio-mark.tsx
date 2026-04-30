type StudioMarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * The [md] bracket mark used by getdesign. Source of truth lives in
 * apps/studio/src/renderer/src/components/logo.tsx — keep them in sync.
 */
export function StudioMark({ size = 22, className, title }: StudioMarkProps) {
  const height = size;
  const width = Math.round(size * 1.5);

  return (
    <svg
      viewBox="0 0 60 40"
      width={width}
      height={height}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={!title}
      shapeRendering="geometricPrecision"
      className={className}
    >
      <path
        d="M11 5 L4 5 L4 35 L11 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M49 5 L56 5 L56 35 L49 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <text
        x="30"
        y="28"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="20"
        fontWeight={600}
        letterSpacing="-1"
        fill="currentColor"
      >
        md
      </text>
    </svg>
  );
}

type StudioWordmarkProps = {
  className?: string;
};

/**
 * "[md] getdesign Studio" lockup. `get` is muted, `design` is foreground,
 * `Studio` is rendered as a small monospace label.
 */
export function StudioWordmark({ className }: StudioWordmarkProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      aria-label="getdesign Studio"
    >
      <StudioMark size={22} />
      <span className="inline-flex items-baseline text-[15px] font-medium tracking-tight">
        <span className="text-muted">get</span>
        <span className="text-foreground">design</span>
      </span>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-subtle sm:inline">
        Studio
      </span>
    </span>
  );
}
