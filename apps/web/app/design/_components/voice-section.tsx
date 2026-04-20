import { VOICE } from "./design-data";

export function VoiceSection() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="grid grid-cols-[72px_1fr_1fr] border-b border-[var(--border)] bg-[var(--surface-200)] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--subtle)]">
        <span>#</span>
        <span className="text-[var(--accent)]">Do</span>
        <span className="text-[var(--danger)]">Don&apos;t</span>
      </div>

      {VOICE.map((row, index) => (
        <div
          key={`${row.do}-${index}`}
          className="grid grid-cols-[72px_1fr_1fr] border-b border-[var(--border)] bg-[var(--surface-100)] px-5 py-5 last:border-b-0"
        >
          <span className="font-mono text-[11px] text-[var(--subtle)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[13.5px] text-foreground">{row.do}</span>
          <span className="text-[13.5px] text-[var(--subtle)] line-through decoration-[var(--danger)]/50">
            {row.dont}
          </span>
        </div>
      ))}
    </div>
  );
}
