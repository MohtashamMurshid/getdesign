export function DesignHeader() {
  return (
    <section className="dashed-bottom px-6 py-20 sm:py-28">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span className="text-[var(--accent)]">✦</span>
        design.md
      </div>

      <h1 className="display-hero mt-6 max-w-[820px]">
        The design system <br />
        behind <span className="text-[var(--subtle)]">get</span>
        <span className="text-foreground">design</span>
        <span className="text-[var(--accent)]">.</span>
      </h1>

      <p className="mt-6 max-w-[560px] text-[14.5px] leading-relaxed text-muted">
        A living <span className="text-foreground">design.md</span> — rendered.
        Every swatch copies its CSS variable. Every component is the real
        component. If you&apos;d like this for your site, that&apos;s the whole
        product.
      </p>
    </section>
  );
}
