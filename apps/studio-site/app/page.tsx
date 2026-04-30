import { getRepoStats } from "./_lib/releases";
import { DetailsSection } from "./_components/details-section";
import { FinalCtaSection } from "./_components/final-cta-section";
import { ProvidersSection } from "./_components/providers-section";
import { StudioFooter } from "./_components/studio-footer";
import { StudioHero } from "./_components/studio-hero";
import { StudioNav } from "./_components/studio-nav";
import { StudioScreenshot } from "./_components/studio-screenshot";
import { ThreadsSection } from "./_components/threads-section";

export default async function StudioLandingPage() {
  const repo = await getRepoStats();

  return (
    <>
      <StudioNav stars={repo.stars} />
      <main className="flex-1">
        <StudioHero />
        <StudioScreenshot />
        <ProvidersSection />
        <DetailsSection />
        <ThreadsSection />
        <FinalCtaSection />
      </main>
      <StudioFooter />
    </>
  );
}
