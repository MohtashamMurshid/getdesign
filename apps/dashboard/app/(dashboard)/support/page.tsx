import { SITE_GITHUB_URL, docsUrl } from "@getdesign/content";

import {
  DocsLinkCard,
  SurfacePageShell,
} from "@/components/developer";

function SupportVisual() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/40 px-4 py-3">
        <p className="text-sm font-medium">How can we help?</p>
      </div>
      <div className="space-y-3 px-4 py-5 text-sm text-muted-foreground">
        <p>
          Start with the FAQ and docs. For bugs or feature requests, open a
          GitHub issue on the public repo.
        </p>
        <p>
          Account and team settings live under Settings in the sidebar — WorkOS
          handles profile and organization membership.
        </p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <SurfacePageShell
      title="Support"
      description="Docs, FAQ, and the public issue tracker."
      demo={<SupportVisual />}
    >
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Resources</h2>
        <div className="grid gap-2">
          <DocsLinkCard
            href={docsUrl("/resources/faq")}
            title="FAQ"
            description="Auth model, rate limits, and common questions"
          />
          <DocsLinkCard
            href={docsUrl("/")}
            title="Documentation"
            description="Quickstart, surfaces, and guides"
          />
          <DocsLinkCard
            href={`${SITE_GITHUB_URL}/issues`}
            title="GitHub Issues"
            description="Report a bug or request a feature"
          />
          <DocsLinkCard
            href="/account"
            title="Account settings"
            description="WorkOS profile and security"
            external={false}
          />
        </div>
      </section>
    </SurfacePageShell>
  );
}
