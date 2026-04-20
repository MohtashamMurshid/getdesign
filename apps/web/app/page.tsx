import HeroCard from "./hero-card";
import InteractiveDemo from "./interactive-demo";
import { Logo } from "./logo";
import Nav from "./nav";
import WaitlistForm from "./waitlist-form";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-foreground">
      {/* vertical dashed rails — extend the full page height, aligned to
          the max-w-6xl content column, so the nav and body share the same
          left/right framing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex justify-center"
      >
        <div className="relative h-full w-full max-w-6xl">
          <div className="dashed-left absolute inset-y-0 left-0 w-px" />
          <div className="dashed-right absolute inset-y-0 right-0 w-px" />
        </div>
      </div>

      <div className="relative z-10">
        <Nav />
        <main className="mx-auto max-w-6xl px-6">
          <FrameSection fullHeight>
            <Hero />
          </FrameSection>
          <FrameSection id="how">
            <HowItWorks />
          </FrameSection>
          <FrameSection id="surfaces">
            <Surfaces />
          </FrameSection>
          <FrameSection id="cta">
            <FinalCta />
          </FrameSection>
        </main>
        <Footer />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                              */
/* ------------------------------------------------------------------ */

function FrameSection({
  id,
  children,
  fullHeight,
}: {
  id?: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <section
      id={id}
      className={
        fullHeight
          ? "dashed-bottom flex min-h-[calc(100vh-56px)] items-center px-6 py-12"
          : "dashed-bottom px-6 py-16 sm:py-20"
      }
    >
      <div className={fullHeight ? "w-full" : undefined}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div>
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className="text-[var(--accent)]">✦</span>
          Own your design system
        </div>

        <h1 className="display-hero mt-6 max-w-[560px]">
          The design system
          <br />
          for any URL<span className="text-[var(--accent)]">.</span>
        </h1>

        <p className="mt-6 max-w-[480px] text-[14.5px] leading-relaxed text-muted">
          getdesign opens a site in a real browser, extracts palette,
          typography, and components, and returns a production-grade{" "}
          <span className="text-foreground">design.md</span> — grounded in the
          site&apos;s actual CSS. Five surfaces, one agent.
        </p>

        <div className="mt-8">
          <WaitlistForm variant="compact" />
          <p className="mt-2.5 text-[11px] text-[var(--subtle)]">
            Private beta · Early access · No spam
          </p>
        </div>

        <div className="mt-8 flex items-center gap-4 text-[11.5px] text-[var(--subtle)]">
          <span>Web</span>
          <Dot />
          <span>API</span>
          <Dot />
          <span>CLI</span>
          <Dot />
          <span>SDK</span>
          <Dot />
          <span>Skill</span>
        </div>
      </div>

      <HeroCard />
    </div>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-[var(--subtle)]" />;
}

/* ------------------------------------------------------------------ */
/* How it works (interactive)                                          */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="display-md">How it works</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Pick a site, then switch between web, api, cli, and sdk. Every
          surface calls the same agent core — only the transport changes.
        </p>
      </div>

      <div className="mt-10">
        <InteractiveDemo />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

function Surfaces() {
  const items = [
    {
      tag: "01",
      title: "Web",
      domain: "getdesign.app",
      body: "Streaming chat UI with a live design.md artifact panel.",
    },
    {
      tag: "02",
      title: "API",
      domain: "api.getdesign.app",
      body: "GET /?url=… returns text/markdown. No auth in v1.",
    },
    {
      tag: "03",
      title: "CLI",
      domain: "npx @getdesign/cli",
      body: "One-shot and interactive REPL. Single Bun binary.",
    },
    {
      tag: "04",
      title: "SDK",
      domain: "npm i @getdesign/sdk",
      body: "Typed client. getDesign(url) + streamDesign(url).",
    },
    {
      tag: "05",
      title: "Skill",
      domain: "skills add MohtashamMurshid/getdesign",
      body: "Portable SKILL.md. Runs inside Claude Code, Codex, Cursor — using your agent's own tools.",
    },
  ];
  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="display-md">Five surfaces, one agent.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Four surfaces call the same agent core. The fifth runs inside yours.
        </p>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((it) => (
          <div
            key={it.tag}
            className="group bg-[var(--surface-100)] p-5 transition-colors hover:bg-[var(--surface-200)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--subtle)]">
                {it.tag}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--faint)] transition-colors group-hover:bg-[var(--accent)]" />
            </div>
            <div className="mt-8 text-[18px] tracking-tight text-foreground">
              {it.title}
            </div>
            <div className="mt-1 font-mono text-[11.5px] text-[var(--accent)]">
              {it.domain}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              {it.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        Shipping Q2 2026
      </div>
      <h2 className="display-md mt-6">
        Get the first invite when getdesign ships.
      </h2>
      <p className="mt-3 text-[14px] text-muted">
        One email per milestone. The API, the CLI, the SDK. Nothing else.
      </p>
      <div className="mt-8 flex justify-center">
        <WaitlistForm variant="compact" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-[12.5px] text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-[var(--subtle)]">
            — on-demand design systems
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#how" className="hover:text-foreground">
            Docs
          </a>
          <a href="#surfaces" className="hover:text-foreground">
            Surfaces
          </a>
          <a href="/design" className="hover:text-foreground">
            Design
          </a>
          <a
            href="https://github.com/MohtashamMurshid/getdesign"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <span className="text-[var(--subtle)]">© 2026 getdesign</span>
        </div>
      </div>
    </footer>
  );
}
