import type { Metadata } from "next";

import { MarketingShell } from "../_components/marketing-shell";
import { SiteFooter } from "../_components/site-footer";
import { ComponentsSection } from "./_components/components-section";
import { DesignHeader } from "./_components/design-header";
import { DesignSection } from "./_components/design-section";
import { LogoSection } from "./_components/logo-section";
import { MotionSection } from "./_components/motion-section";
import { PaletteSection } from "./_components/palette-section";
import { SpacingSection } from "./_components/spacing-section";
import { TypographySection } from "./_components/typography-section";
import { VoiceSection } from "./_components/voice-section";

export const metadata: Metadata = {
  title: "Design",
  description:
    "The living design.md behind getdesign. Logo, palette, typography, spacing, components, motion, and voice, rendered as the real product.",
  alternates: { canonical: "/design" },
  openGraph: {
    title: "Design · getdesign",
    description:
      "The living design.md behind getdesign. Tokens, components, motion, and voice.",
    url: "/design",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Design · getdesign",
    description:
      "The living design.md behind getdesign. Tokens, components, motion, and voice.",
  },
};

export default function DesignPage() {
  return (
    <MarketingShell footer={<SiteFooter variant="design" />}>
      <DesignHeader />
      <DesignSection id="logo" tag="01" title="Logo">
        <LogoSection />
      </DesignSection>
      <DesignSection id="palette" tag="02" title="Palette">
        <PaletteSection />
      </DesignSection>
      <DesignSection id="type" tag="03" title="Typography">
        <TypographySection />
      </DesignSection>
      <DesignSection id="spacing" tag="04" title="Spacing & Radius">
        <SpacingSection />
      </DesignSection>
      <DesignSection id="components" tag="05" title="Components">
        <ComponentsSection />
      </DesignSection>
      <DesignSection id="motion" tag="06" title="Motion">
        <MotionSection />
      </DesignSection>
      <DesignSection id="voice" tag="07" title="Voice & Tone">
        <VoiceSection />
      </DesignSection>
    </MarketingShell>
  );
}
