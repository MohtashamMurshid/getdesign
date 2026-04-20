import { Specimen } from "./design-primitives";

export function TypographySection() {
  return (
    <div className="space-y-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
      <Specimen
        tag=".display-hero"
        spec="clamp(36px, 6vw, 64px) / 1.04 / -0.035em / 500"
      >
        <span className="display-hero">
          The design system for any URL
          <span className="text-[var(--accent)]">.</span>
        </span>
      </Specimen>
      <Specimen
        tag=".display-md"
        spec="clamp(22px, 2.8vw, 32px) / 1.15 / -0.025em / 500"
      >
        <span className="display-md">Five surfaces, one agent.</span>
      </Specimen>
      <Specimen tag="body" spec="14.5px / 1.6 / -0.005em / 400">
        <p className="max-w-[620px] text-[14.5px] leading-relaxed text-muted">
          getdesign opens a site in a real browser, extracts palette,
          typography, and components, and returns a production-grade design.md —
          grounded in the site&apos;s actual CSS.
        </p>
      </Specimen>
      <Specimen tag=".eyebrow" spec="12px / 1.4 / -0.01em / muted">
        <span className="eyebrow">OWN YOUR DESIGN SYSTEM</span>
      </Specimen>
      <Specimen tag="mono" spec="JetBrains Mono / 12px / tnum">
        <span className="font-mono text-[12px] text-[var(--accent)]">
          npx @getdesign/cli https://stripe.com
        </span>
      </Specimen>
    </div>
  );
}
