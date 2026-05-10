export function BrandMark({ size = 26 }: { size?: number }) {
  const height = size;
  const width = Math.round(size * 1.5);

  return (
    <svg
      viewBox="0 0 60 40"
      width={width}
      height={height}
      fill="none"
      role="img"
      aria-label="getdesign"
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
        fontFamily="var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace"
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
