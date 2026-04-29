import { PRODUCT_SURFACES } from "../../_lib/site";
import { WaitlistCount } from "../waitlist-count";
import WaitlistForm from "../waitlist-form";
import HeroCard from "./hero-card";

type HeroSectionProps = {
  waitlistCount?: number | null;
};

export function HeroSection({ waitlistCount = null }: HeroSectionProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div>
        {waitlistCount != null && waitlistCount > 0 ? (
          <WaitlistCount count={waitlistCount} />
        ) : (
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span className="text-[var(--accent)]">✦</span>
            Own your design system
          </div>
        )}

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
          <WaitlistForm variant="compact" />
          <p className="mt-2.5 text-[11px] text-[var(--subtle)]">
            Private beta · Early access · No spam
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
