import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "../../_components/marketing-shell";
import { SiteFooter } from "../../_components/site-footer";
import { getCurrentUser } from "../../_lib/auth";
import { getUserCredentialStatus } from "../../_lib/credentials";
import { isWorkOSConfigured } from "../../_lib/workos";
import { signOutAction } from "./actions";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage the API keys getdesign uses to run your designs.",
  alternates: { canonical: "/dashboard/settings" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <MarketingShell footer={<SiteFooter />}>
      <Header />
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-xl">
          <SettingsBody />
        </div>
      </section>
    </MarketingShell>
  );
}

function Header() {
  return (
    <section className="dashed-bottom px-6 py-16 sm:py-20">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span className="text-[var(--accent)]">✦</span>
        Settings
      </div>
      <h1 className="display-hero mt-6 max-w-[820px]">
        Your <span className="text-foreground">keys</span>
        <span className="text-[var(--accent)]">.</span>
      </h1>
      <p className="mt-6 max-w-[560px] text-[14.5px] leading-relaxed text-muted">
        Save your Daytona and OpenAI keys once. The dashboard reuses them for
        every run so you don&apos;t have to paste them each time.
      </p>
    </section>
  );
}

async function SettingsBody() {
  if (!isWorkOSConfigured()) {
    return <LocalModeNotice />;
  }

  const user = await getCurrentUser();
  if (!user) {
    return <SignInPrompt />;
  }

  const status = await getUserCredentialStatus(user.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-100)] px-4 py-3">
        <div className="text-[12.5px] text-muted">
          Signed in as{" "}
          <span className="text-foreground">{user.email}</span>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="btn-ghost rounded-md px-3 py-1.5 text-[12px]"
          >
            Sign out
          </button>
        </form>
      </div>

      <SettingsForm
        daytona={{ set: status.daytona.set, hint: status.daytona.hint }}
        openai={{ set: status.openai.set, hint: status.openai.hint }}
      />

      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-[12.5px] text-[var(--subtle)] underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="dashed-frame rounded-xl bg-[var(--surface-100)] px-6 py-14 text-center">
      <div className="mx-auto max-w-sm space-y-5">
        <p className="text-[13.5px] text-muted">
          Sign in to securely store your Daytona and OpenAI keys in WorkOS Vault
          and reuse them across runs.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/login"
            className="btn-accent inline-flex h-9 items-center rounded-md px-4 text-[12.5px] font-medium"
          >
            Sign in
          </a>
          <a
            href="/login?screen=sign-up"
            className="btn-ghost inline-flex h-9 items-center rounded-md px-4 text-[12.5px]"
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}

function LocalModeNotice() {
  return (
    <div className="dashed-frame rounded-xl bg-[var(--surface-100)] px-6 py-14 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--subtle)]">
          local mode
        </div>
        <p className="text-[13.5px] text-muted">
          Account-based key storage requires WorkOS to be configured. Set{" "}
          <code className="font-mono text-foreground">WORKOS_API_KEY</code>,{" "}
          <code className="font-mono text-foreground">WORKOS_CLIENT_ID</code>,
          and{" "}
          <code className="font-mono text-foreground">
            WORKOS_COOKIE_PASSWORD
          </code>{" "}
          to enable sign-in and WorkOS Vault.
        </p>
        <p className="text-[12.5px] text-[var(--subtle)]">
          Without WorkOS, the dashboard still runs using keys entered in the form
          or the{" "}
          <code className="font-mono text-foreground">DAYTONA_API_KEY</code> /{" "}
          <code className="font-mono text-foreground">OPENAI_API_KEY</code>{" "}
          environment variables.
        </p>
        <Link
          href="/dashboard"
          className="inline-block text-[12.5px] text-[var(--subtle)] underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
