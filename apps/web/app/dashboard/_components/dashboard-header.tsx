export function DashboardHeader() {
  return (
    <section className="dashed-bottom px-6 py-16 sm:py-20">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span className="text-[var(--accent)]">✦</span>
        Dashboard
      </div>

      <h1 className="display-hero mt-6 max-w-[820px]">
        Generate a <span className="text-foreground">design.md</span>
        <br />
        from any URL<span className="text-[var(--accent)]">.</span>
      </h1>

      <p className="mt-6 max-w-[560px] text-[14.5px] leading-relaxed text-muted">
        Paste a URL and your own Daytona and OpenAI keys. The agent renders the
        site in a real browser, extracts tokens and components, and returns a
        production-grade <span className="text-foreground">design.md</span>.
      </p>
    </section>
  );
}
