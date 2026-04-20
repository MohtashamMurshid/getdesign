import PipelineSVG from "./pipeline-svg";
import WaitlistForm from "./waitlist-form";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Surfaces />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */

function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 text-[14px]">
          <Logo />
          <span className="font-medium tracking-tight">getdesign</span>
        </a>

        <div className="hidden items-center gap-7 text-[13px] text-muted md:flex">
          <a href="#surfaces" className="hover:text-foreground transition-colors">
            Surfaces
          </a>
          <a href="#cta" className="hover:text-foreground transition-colors">
            Waitlist
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>

        <a
          href="#cta"
          className="btn-accent inline-flex h-8 items-center rounded-md px-3 text-[12.5px] font-medium"
        >
          Get notified
        </a>
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-strong bg-surface-200">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M2 8 L8 2 L14 8 L8 14 Z"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1.5" fill="var(--accent)" />
      </svg>
    </span>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-14 sm:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-100 px-3 py-1 text-[11.5px] uppercase tracking-[0.15em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Coming soon
          </div>

          <h1 className="display-hero mt-8">
            design systems
            <br />
            from any URL<span className="text-accent">.</span>
          </h1>

          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted">
            Paste a URL. Get a production-grade{" "}
            <span className="text-foreground">design.md</span>.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3" id="cta">
            <WaitlistForm />
          </div>
        </div>

        <div className="relative mt-20">
          <PipelineSVG />
          <div className="mt-6 flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.18em] text-subtle">
            <span>crawl</span>
            <Separator />
            <span>screenshot</span>
            <Separator />
            <span>extract</span>
            <Separator />
            <span>synthesize</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Separator() {
  return <span className="h-px w-8 bg-border-strong" />;
}

/* ---------- Surfaces ---------- */

function Surfaces() {
  const items = [
    { title: "Web", domain: "getdesign.app", icon: <WebIcon /> },
    { title: "API", domain: "api.getdesign.app", icon: <ApiIcon /> },
    { title: "CLI", domain: "npx getdesign", icon: <CliIcon /> },
    { title: "SDK", domain: "npm i getdesign", icon: <SdkIcon /> },
  ];
  return (
    <section id="surfaces" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="group relative flex flex-col items-start bg-background p-6 transition-colors hover:bg-surface-100"
            >
              <div className="text-muted transition-colors group-hover:text-foreground">
                {it.icon}
              </div>
              <div className="mt-10 text-[18px] tracking-tight text-foreground">
                {it.title}
              </div>
              <div className="mt-1 text-[12px] text-muted">{it.domain}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Surface icons (SVG, animated on hover via group) ---------- */

function WebIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="2" y="5" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="10" x2="26" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="7.5" r="0.7" fill="currentColor" />
      <circle cx="8" cy="7.5" r="0.7" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="0.7" fill="currentColor" />
    </svg>
  );
}

function ApiIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M4 14 L10 14 M18 14 L24 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="10"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="4" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CliIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect
        x="2"
        y="5"
        width="24"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 11 L11 14 L7 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="13"
        y1="18"
        x2="20"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SdkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M14 3 L24 8 L24 20 L14 25 L4 20 L4 8 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 3 L14 25 M4 8 L24 8 M4 20 L24 20"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

/* ---------- Final CTA ---------- */

function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="display-md">Get the first invite.</h2>
        <div className="mt-8 flex justify-center">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-[13px] text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-foreground">getdesign</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#surfaces" className="hover:text-foreground">
            Surfaces
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <span className="text-subtle">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
