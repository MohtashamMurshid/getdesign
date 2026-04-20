import WaitlistForm from "../waitlist-form";

export function FinalCtaSection() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        Shipping Q2 2026
      </div>

      <h2 className="display-md mt-6">
        Get the first invite when getdesign ships.
      </h2>

      <p className="mt-3 text-[14px] text-muted">
        One email per milestone. The API, the CLI, the SDK. Nothing else.
      </p>

      <div className="mt-8 flex justify-center">
        <WaitlistForm variant="compact" />
      </div>
    </div>
  );
}
