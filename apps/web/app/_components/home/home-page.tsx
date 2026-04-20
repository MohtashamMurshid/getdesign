import { FrameSection } from "./frame-section";
import { FinalCtaSection } from "./final-cta-section";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { SurfacesSection } from "./surfaces-section";

export function HomePage() {
  return (
    <>
      <FrameSection fullHeight>
        <HeroSection />
      </FrameSection>
      <FrameSection id="how">
        <HowItWorksSection />
      </FrameSection>
      <FrameSection id="surfaces">
        <SurfacesSection />
      </FrameSection>
      <FrameSection id="cta">
        <FinalCtaSection />
      </FrameSection>
    </>
  );
}
