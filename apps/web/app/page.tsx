import UrlForm from "./url-form";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Sample />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
          <Logo />
          <span>getdesign</span>
        </a>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#how" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#sample" className="hover:text-foreground transition-colors">
            Sample
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
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background text-[11px] font-bold">
      gd
    </span>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-300 px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          On-demand design systems
        </span>

        <h1 className="display-72 mt-6 text-foreground">
          Steal the design system
          <br />
          of any brand,
          <span className="font-serif italic"> beautifully.</span>
        </h1>

        <p className="mt-6 text-[17px] leading-relaxed text-muted sm:text-[19px]">
          Paste a URL. An agent opens it in a real browser, extracts the palette,
          typography, spacing, and components, and returns a production-grade
          <span className="font-mono text-foreground"> design.md</span> — grounded
          in the site&apos;s actual CSS.
        </p>

        <div className="mt-10">
          <UrlForm />
        </div>

        <p className="mt-4 text-xs text-muted">
          Works with public URLs. No sign-up. API, CLI, and chat on the way.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      k: "01",
      title: "Crawl",
      body: "We fetch the HTML, all stylesheets, @import chains, and @font-face sources.",
    },
    {
      k: "02",
      title: "Screenshot",
      body: "A real Chromium inside a Daytona sandbox captures a hero + full-page image.",
    },
    {
      k: "03",
      title: "Extract",
      body: "Deterministic CSS parsing produces a token graph — colors, type, radii, shadows.",
    },
    {
      k: "04",
      title: "Synthesize",
      body: "A model writes the 9-section design.md. Every value is grounded in what we found.",
    },
  ];
  return (
    <section id="how" className="border-t border-border bg-surface-300/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="display-36">How it works</h2>
        <p className="mt-3 max-w-xl text-[17px] text-muted">
          One URL in, one markdown file out. No hallucinated hex codes.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.k}
              className="rounded-xl border border-border bg-background p-5"
            >
              <div className="font-mono text-xs text-muted">{s.k}</div>
              <div className="mt-6 text-lg font-medium tracking-tight">
                {s.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sample() {
  return (
    <section id="sample" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="display-36">What you get</h2>
        <p className="mt-3 max-w-xl text-[17px] text-muted">
          A structured 9-section spec matching a reference
          <span className="font-mono"> design.md</span> template.
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-foreground text-background">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-white/20" />
            <span className="h-3 w-3 rounded-full bg-white/20" />
            <span className="h-3 w-3 rounded-full bg-white/20" />
            <span className="ml-3 font-mono text-xs text-white/50">
              design.md
            </span>
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-white/90">
{`# Design System Inspired by Cursor

## 1. Visual Theme & Atmosphere
Warm minimalism meets code-editor elegance. Warm off-white
canvas (#f2f1ed), dark warm-brown text (#26251e)...

## 2. Color Palette & Roles
- Cursor Dark (#26251e) — primary text
- Cursor Cream (#f2f1ed) — page background
- Cursor Orange (#f54e00) — brand accent

## 3. Typography Rules
CursorGothic display, jjannon serif body, berkeleyMono code.
Letter-spacing scales with size: -2.16px @ 72px, -0.72px @ 36px...

## 4. Component Stylings
Primary button: #ebeae5 bg, #26251e text, 8px radius,
10px 12px 10px 14px padding. Hover shifts text to #cf2d56.

...`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span>getdesign</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/prd.md" className="hover:text-foreground">
            PRD
          </a>
          <a href="/architecture.md" className="hover:text-foreground">
            Architecture
          </a>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
