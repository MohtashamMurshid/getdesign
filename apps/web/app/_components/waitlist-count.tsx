import { formatWaitlistCount } from "../_lib/waitlist-count";

type WaitlistCountProps = {
  count: number | null;
  align?: "start" | "center";
};

export function WaitlistCount({ count, align = "start" }: WaitlistCountProps) {
  if (count == null || count <= 0) return null;

  const justify = align === "center" ? "justify-center" : "justify-start";

  return (
    <div
      className={`mb-3 flex ${justify}`}
      aria-live="polite"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-2.5 py-1 text-[11px] text-muted">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        </span>
        <span className="text-foreground tabular-nums">
          {formatWaitlistCount(count)}
        </span>
        <span>on the waitlist</span>
      </div>
    </div>
  );
}
