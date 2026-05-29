import type { Metadata } from "next";

import { MarketingShell } from "../_components/marketing-shell";
import { SiteFooter } from "../_components/site-footer";
import { getCurrentUser } from "../_lib/auth";
import { getUserCredentialStatus } from "../_lib/credentials";
import { isWorkOSConfigured } from "../_lib/workos";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardRunner } from "./_components/dashboard-runner";
import type { DashboardAccess } from "./_components/types";

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

export const dynamic = "force-dynamic";

async function resolveAccess(): Promise<DashboardAccess> {
  const env = {
    daytona: Boolean(process.env.DAYTONA_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
  };

  if (!isWorkOSConfigured()) {
    return {
      workosConfigured: false,
      userEmail: null,
      stored: { daytona: false, openai: false },
      env,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      workosConfigured: true,
      userEmail: null,
      stored: { daytona: false, openai: false },
      env,
    };
  }

  const status = await getUserCredentialStatus(user.id);
  return {
    workosConfigured: true,
    userEmail: user.email,
    stored: { daytona: status.daytona.set, openai: status.openai.set },
    env,
  };
}

export default async function DashboardPage() {
  const access = await resolveAccess();
  return (
    <MarketingShell footer={<SiteFooter />}>
      <DashboardHeader />
      <DashboardRunner access={access} />
    </MarketingShell>
  );
}
