type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "mark" | "lockup" | "wordmark";

const SIZE_MAP: Record<LogoSize, { mark: number; gap: string; word: string }> = {
  sm: { mark: 22, gap: "gap-1.5", word: "text-[13px]" },
  md: { mark: 28, gap: "gap-2", word: "text-[15px]" },
  lg: { mark: 38, gap: "gap-3", word: "text-[20px]" },
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
      title={variant === "mark" ? title : undefined}
    />
  );

  if (variant === "mark") {
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
  title?: string;
};

export function Mark({ size = 28, title }: MarkProps) {
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

function Wordmark() {
  return (
    <>
      <span className="text-muted-foreground">get</span>
      <span className="text-foreground">design</span>
    </>
  );
}
