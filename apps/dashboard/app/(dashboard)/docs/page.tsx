import { DOCS_BASE_URL, docsUrl } from "@getdesign/content";

import {
  DocsLinkCard,
  SurfacePageShell,
} from "@/components/developer";

const LINKS = [
  {
    href: docsUrl("/"),
    title: "Documentation home",
    description: "Start here — overview of getdesign",
  },
  {
    href: docsUrl("/quickstart"),
    title: "Quickstart",
    description: "First design.md in a few minutes",
  },
  {
    href: docsUrl("/surfaces/api"),
    title: "API",
    description: "HTTP endpoint at api.getdesign.app",
  },
  {
    href: docsUrl("/surfaces/cli"),
    title: "CLI",
    description: "bunx @getdesign/cli",
  },
  {
    href: docsUrl("/surfaces/sdk"),
    title: "SDK",
    description: "@getdesign/sdk typed client",
  },
  {
    href: docsUrl("/surfaces/skill"),
    title: "Skill",
    description: "Agent skill for Cursor / Claude Code / Codex",
  },
  {
    href: docsUrl("/guides/call-the-api"),
    title: "Guide: call the API",
    description: "curl examples and response shapes",
  },
  {
    href: docsUrl("/guides/sdk-in-next"),
    title: "Guide: SDK in Next.js",
    description: "Route handler with streamDesign",
  },
  {
    href: docsUrl("/reference/sdk"),
    title: "SDK reference",
    description: "TypeDoc API reference",
  },
  {
    href: docsUrl("/resources/faq"),
    title: "FAQ",
    description: "Auth, rate limits, and common questions",
  },
] as const;

function DocsHubVisual() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          docs.getdesign.app
        </div>
      </div>
      <div className="space-y-4 px-5 py-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">Documentation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Full guides and reference live on the docs site. Use the links on
            the right — or open the hub directly.
          </p>
        </div>
        <a
          href={DOCS_BASE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Open docs.getdesign.app →
        </a>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <SurfacePageShell
      title="Docs"
      description="Curated links into docs.getdesign.app — quickstart, surfaces, guides, and reference."
      demo={<DocsHubVisual />}
    >
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Browse</h2>
        <div className="grid gap-2">
          {LINKS.map((link) => (
            <DocsLinkCard key={link.href} {...link} />
          ))}
        </div>
      </section>
    </SurfacePageShell>
  );
}
