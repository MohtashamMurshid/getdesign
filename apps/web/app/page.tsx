import { HomePage } from "./_components/home/home-page";
import { MarketingShell } from "./_components/marketing-shell";
import { SiteFooter } from "./_components/site-footer";

export default function Home() {
  return (
    <MarketingShell footer={<SiteFooter />}>
      <HomePage />
    </MarketingShell>
  );
}
