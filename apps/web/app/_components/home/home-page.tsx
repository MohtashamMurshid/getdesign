import { getWaitlistCount } from "../../_lib/waitlist-count";
import { FrameSection } from "./frame-section";
import { FinalCtaSection } from "./final-cta-section";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { SurfacesSection } from "./surfaces-section";

export async function HomePage() {
  const waitlistCount = await getWaitlistCount();

  return (
    <>
      <FrameSection fullHeight>
        <HeroSection waitlistCount={waitlistCount} />
      </FrameSection>
      <FrameSection id="how">
        <HowItWorksSection />
      </FrameSection>
      <FrameSection id="surfaces">
        <SurfacesSection />
      </FrameSection>
      <FrameSection id="cta">
        <FinalCtaSection waitlistCount={waitlistCount} />
      </FrameSection>
    </>
  );
}
