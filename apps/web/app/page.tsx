import WaitlistForm from "./waitlist-form";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <GridBackdrop />
      <Nav />
      <StripeBand />
      <main className="relative">
        <Hero />
        <Surfaces />
        <HowItWorks />
        <SchemaPreview />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Backdrops ---------- */

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 dot-grid opacity-70"
    />
  );
}

function StripeBand() {
  return (
    <div className="stripe-band relative h-3 w-full border-b border-[var(--border)]" />
  );
}

/* ---------- Nav ---------- */

function Nav() {
  return (
    <nav className="relative z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 text-[14px]">
          <Logo />
          <span className="font-medium tracking-tight">getdesign</span>
        </a>

        <div className="hidden items-center gap-7 text-[13px] text-muted md:flex">
          <a href="#surfaces" className="hover:text-foreground transition-colors">
            Studio
          </a>
          <a href="#surfaces" className="hover:text-foreground transition-colors">
            API
          </a>
          <a href="#how" className="hover:text-foreground transition-colors">
            How
          </a>
          <a href="#schema" className="hover:text-foreground transition-colors">
            Schema
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--surface-100)] text-muted hover:text-foreground"
          >
            <GithubIcon />
          </a>
          <a
            href="#cta"
            className="btn-accent inline-flex h-8 items-center rounded-md px-3 text-[12.5px] font-medium"
          >
            Get notified
          </a>
        </div>
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--surface-200)]">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--accent-glow),transparent_60%)]" />
      <svg
        viewBox="0 0 16 16"
        className="relative h-3.5 w-3.5"
        fill="none"
        aria-hidden
      >
        <path
          d="M2 8 L8 2 L14 8 L8 14 Z"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1.6" fill="var(--accent)" />
      </svg>
    </span>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.22 9.17 7.69 10.65.56.1.77-.24.77-.54 0-.27-.01-1.17-.02-2.12-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.16-1.46 3.1-1.16 3.1-1.16.62 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.03 0 4.32-2.64 5.27-5.15 5.55.4.34.76 1.02.76 2.06 0 1.48-.01 2.67-.01 3.03 0 .3.2.65.78.54 4.47-1.48 7.69-5.69 7.69-10.65C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[900px] -translate-x-1/2 glow-accent"
      />
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-14 sm:pt-28 sm:pb-20">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11.5px] uppercase tracking-[0.15em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
            Coming soon
            <span className="text-[var(--subtle)]">—</span>
            <a
              href="#how"
              className="text-[var(--accent)] hover:underline underline-offset-4"
            >
              read docs
            </a>
          </div>

          <h1 className="display-hero mt-8 max-w-4xl">
            The design system
            <br />
            for any URL<span className="text-[var(--accent)]">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-[16px]">
            getdesign opens a site in a real browser, extracts palette,
            typography, and components, and returns a production-grade
            <span className="text-foreground"> design.md</span> — grounded in
            the site&apos;s actual CSS. Built for designers, engineers, and AI
            tools that demand precision.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3" id="cta">
            <WaitlistForm />
            <p className="text-[11.5px] text-[var(--subtle)]">
              Early access • No spam • Unsubscribe anytime
            </p>
          </div>
        </div>

        <TerminalShowcase />
      </div>
    </section>
  );
}

function TerminalShowcase() {
  return (
    <div className="mt-16 grid gap-4 md:grid-cols-2">
      <TerminalCard title="Chat — getdesign.app">
        <Line user>
          <span className="text-[var(--accent)]">›</span> Extract the design
          system from <span className="text-foreground">cursor.com</span>
        </Line>
        <Line>
          <Dot /> Opened chromium inside Daytona{" "}
          <span className="text-[var(--subtle)]">/sandbox</span>
        </Line>
        <Line>
          <Dot /> Captured <span className="text-foreground">hero.png</span> at
          1440×900
        </Line>
        <Line>
          <Dot /> Extracted 14 tokens{" "}
          <span className="text-[var(--subtle)]">
            /palette /typography /radii
          </span>
        </Line>
        <Line user>
          <span className="text-[var(--accent)]">›</span> Synthesize the 9
          sections
        </Line>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Writing design.md…</span>
            <span className="text-[var(--accent)]">72%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-300)] progress-bar">
            <span />
          </div>
        </div>
      </TerminalCard>

      <TerminalCard title="API — api.getdesign.app">
        <Line>
          <span className="text-[var(--subtle)]">$</span>{" "}
          <span className="text-foreground">curl</span>{" "}
          &apos;api.getdesign.app/?url=cursor.com&apos;
        </Line>
        <Line>
          <span className="text-[var(--subtle)]"># </span>
          <span className="text-muted">
            content-type: text/markdown; charset=utf-8
          </span>
        </Line>
        <div className="mt-3 space-y-1.5 border-l border-[var(--border)] pl-3 text-[12.5px]">
            <div className="text-foreground"># Design System Inspired by Cursor</div>
            <div className="text-muted">## 1. Visual Theme &amp; Atmosphere</div>
            <div className="text-muted">## 2. Color Palette &amp; Roles</div>
            <div className="text-muted">## 3. Typography Rules</div>
            <div className="text-muted">## 4. Component Stylings</div>
            <div className="text-[var(--subtle)]">…5 more sections</div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          200 OK · 8.2s · 14.3 KB
        </div>
      </TerminalCard>
    </div>
  );
}

function TerminalCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="scanline-card overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-100)] shadow-[0_30px_80px_-40px_rgba(52,229,161,0.25)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-200)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-3 text-[11.5px] text-[var(--subtle)]">{title}</span>
      </div>
      <div className="space-y-1.5 p-4 text-[12.5px] leading-relaxed text-muted">
        {children}
      </div>
    </div>
  );
}

function Line({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: boolean;
}) {
  return (
    <div className={user ? "text-foreground" : "text-muted"}>{children}</div>
  );
}

function Dot() {
  return (
    <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-[var(--accent)] align-middle shadow-[0_0_6px_var(--accent-glow)]" />
  );
}

/* ---------- Surfaces ---------- */

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
      domain: "npx getdesign",
      body: "One-shot and interactive REPL (OpenTUI). Single Bun binary.",
    },
    {
      tag: "04",
      title: "SDK",
      domain: "npm i getdesign",
      body: "Typed client. getDesign(url) + streamDesign(url) iterator.",
    },
  ];
  return (
    <section id="surfaces" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow="Surfaces"
          title="Four surfaces, one agent."
          lede="Every surface calls the same agent core. Only the transport differs."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.tag}
              className="group relative bg-[var(--surface-100)] p-6 transition-colors hover:bg-[var(--surface-200)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--subtle)]">
                  {it.tag}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-dim)] transition-colors group-hover:bg-[var(--accent)] group-hover:shadow-[0_0_10px_var(--accent-glow)]" />
              </div>
              <div className="mt-10 text-[20px] tracking-tight text-foreground">
                {it.title}
              </div>
              <div className="mt-1 text-[12px] text-[var(--accent)]">
                {it.domain}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- How ---------- */

function HowItWorks() {
  const steps = [
    {
      k: "crawl",
      title: "Crawl",
      body: "Fetch HTML, stylesheets, @import chains, and @font-face sources.",
    },
    {
      k: "screenshot",
      title: "Screenshot",
      body: "A real Chromium inside a Daytona sandbox captures hero + full page.",
    },
    {
      k: "extract",
      title: "Extract",
      body: "Deterministic parsing → a token graph. No hallucinated hex codes.",
    },
    {
      k: "synthesize",
      title: "Synthesize",
      body: "A model writes the 9-section design.md. Every value is grounded.",
    },
  ];
  return (
    <section id="how" className="border-t border-[var(--border)] bg-[var(--surface-100)]/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow="How it works"
          title="One URL in, one markdown file out."
          lede="A coordinator agent delegates to four sub-agents. Every run is grounded in pixels and CSS."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.k}
              className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
                  ./{s.k}
                </span>
                <span className="font-mono text-[11px] text-[var(--subtle)]">
                  0{i + 1}
                </span>
              </div>
              <div className="mt-8 text-[17px] tracking-tight text-foreground">
                {s.title}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Schema preview ---------- */

function SchemaPreview() {
  const sections = [
    "visualTheme",
    "palette",
    "typography",
    "components",
    "layout",
    "depth",
    "interaction",
    "responsive",
    "motifs",
  ];
  return (
    <section id="schema" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          eyebrow="Schema"
          title="Exact 9-section template."
          lede="Zod-validated DesignDoc → deterministic markdown renderer. No drift, no surprises."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-100)]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-200)] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-3 text-[11.5px] text-[var(--subtle)]">
                design.md
              </span>
            </div>
            <pre className="overflow-x-auto p-5 text-[12.5px] leading-relaxed text-muted">
{`# Design System Inspired by Cursor

## 1. Visual Theme & Atmosphere
Warm minimalism meets code-editor elegance.
Warm off-white canvas (#f2f1ed), dark warm-brown
text (#26251e), tight letter-spacing…

## 2. Color Palette & Roles
- #26251e — primary text
- #f2f1ed — page background
- #f54e00 — brand accent
- #cf2d56 — semantic error

## 3. Typography Rules
CursorGothic display, jjannon serif body,
berkeleyMono code. Letter-spacing scales
with size: -2.16px @ 72px, -0.72px @ 36px…

…`}
<span className="caret" />
            </pre>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
              DesignDoc schema
            </div>
            <ol className="mt-6 space-y-2.5 text-[13.5px]">
              {sections.map((s, i) => (
                <li
                  key={s}
                  className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 last:border-b-0 last:pb-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[var(--subtle)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-foreground">{s}</span>
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    z.object
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
              Keys map 1:1 to markdown sections. A deterministic renderer
              converts the typed object to the exact template — every time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section header ---------- */

function SectionHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted">
        <span className="h-px w-8 bg-[var(--accent)]" />
        {eyebrow}
      </div>
      <h2 className="display-md mt-4 text-foreground">{title}</h2>
      <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{lede}</p>
    </div>
  );
}

/* ---------- Final CTA ---------- */

function FinalCta() {
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11.5px] uppercase tracking-[0.15em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Shipping Q2 2026
        </div>
        <h2 className="display-md mt-6 text-foreground">
          Get the first invite when getdesign ships.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[14px] text-muted">
          We&apos;ll email when the API opens, the CLI hits npm, and the chat
          goes live. One email per milestone. Nothing else.
        </p>
        <div className="mt-8 flex justify-center">
          <WaitlistForm variant="compact" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-100)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-[13px] text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-foreground">getdesign</span>
          <span className="text-[var(--subtle)]">— on-demand design systems</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#surfaces" className="hover:text-foreground">
            Surfaces
          </a>
          <a href="#how" className="hover:text-foreground">
            How
          </a>
          <a href="#schema" className="hover:text-foreground">
            Schema
          </a>
          <a
            href="https://github.com"
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
