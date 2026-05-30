import type { Metadata } from "next";

import { MarketingShell } from "../_components/marketing-shell";
import { SiteFooter } from "../_components/site-footer";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardRunner } from "./_components/dashboard-runner";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Generate a production-grade design.md from any URL. Paste a URL, bring your own Daytona and OpenAI keys, and download the result.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Dashboard · getdesign",
    description:
      "Run the agent live. Paste a URL, watch progress, download the generated design.md.",
    url: "/dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard · getdesign",
    description:
      "Run the agent live. Paste a URL, watch progress, download the generated design.md.",
  },
};

export default function DashboardPage() {
  return (
    <MarketingShell footer={<SiteFooter />}>
      <DashboardHeader />
      <DashboardRunner />
    </MarketingShell>
  );
}
