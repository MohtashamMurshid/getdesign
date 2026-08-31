import {
  PRODUCT_SURFACES,
  SITE_APP_CTA_LABEL,
  SITE_APP_CTA_DESCRIPTION,
  SITE_APP_CTA_SUBTEXT,
  SITE_DASHBOARD_URL,
} from "../../_lib/site";
import HeroCard from "./hero-card";

export function HeroSection() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div>
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className="text-[var(--accent)]">✦</span>
          Own your design system
        </div>

        <h1 className="display-hero mt-6 max-w-[560px]">
          The design system
          <br />
          for any URL<span className="text-[var(--accent)]">.</span>
        </h1>

        <p className="mt-6 max-w-[480px] text-[14.5px] leading-relaxed text-muted">
          getdesign opens a site in a real browser, extracts palette,
          typography, and components, and returns a production-grade{" "}
          <span className="text-foreground">design.md</span>, grounded in the
          site&apos;s actual CSS. Five surfaces, one agent.
        </p>

        <div className="mt-8">
          <a
            href={SITE_DASHBOARD_URL}
            className="btn-accent inline-flex h-10 items-center gap-2 rounded-md px-5 text-[13px] font-medium transition-transform hover:-translate-y-[1px]"
          >
            {SITE_APP_CTA_LABEL}
            <ArrowIcon />
          </a>
          <p className="mt-2.5 max-w-[480px] text-[11px] text-[var(--subtle)]">
            {SITE_APP_CTA_DESCRIPTION}
          </p>
          <p className="mt-1 max-w-[480px] text-[11px] text-[var(--subtle)]">
            {SITE_APP_CTA_SUBTEXT}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-4 text-[11.5px] text-[var(--subtle)]">
          {PRODUCT_SURFACES.map((surface, index) => (
            <div key={surface} className="flex items-center gap-4">
              {index > 0 ? <Dot /> : null}
              <span>{surface}</span>
            </div>
          ))}
        </div>
      </div>

      <HeroCard />
    </div>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-[var(--subtle)]" />;
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h8M9 4l4 4-4 4" />
    </svg>
  );
}
