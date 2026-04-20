"use client";

import { useEffect, useState } from "react";
import Nav from "../nav";
import { Logo, Mark } from "../logo";

/**
 * /design — the design system for the design system.
 *
 * This page dogfoods getdesign's own design.md: every token is hoverable /
 * clickable to copy; every component is rendered live. If this page looks
 * wrong, the product is wrong.
 */

export default function DesignPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-foreground">
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
          <Header />
          <Section id="logo" tag="01" title="Logo">
            <LogoSection />
          </Section>
          <Section id="palette" tag="02" title="Palette">
            <PaletteSection />
          </Section>
          <Section id="type" tag="03" title="Typography">
            <TypographySection />
          </Section>
          <Section id="spacing" tag="04" title="Spacing & Radius">
            <SpacingSection />
          </Section>
          <Section id="components" tag="05" title="Components">
            <ComponentsSection />
          </Section>
          <Section id="motion" tag="06" title="Motion">
            <MotionSection />
          </Section>
          <Section id="voice" tag="07" title="Voice & Tone">
            <VoiceSection />
          </Section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                              */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <section className="dashed-bottom px-6 py-20 sm:py-28">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span className="text-[var(--accent)]">✦</span>
        design.md
      </div>
      <h1 className="display-hero mt-6 max-w-[820px]">
        The design system <br />
        behind <span className="text-[var(--subtle)]">get</span>
        <span className="text-foreground">design</span>
        <span className="text-[var(--accent)]">.</span>
      </h1>
      <p className="mt-6 max-w-[560px] text-[14.5px] leading-relaxed text-muted">
        A living <span className="text-foreground">design.md</span> — rendered.
        Every swatch copies its CSS variable. Every component is the real
        component. If you&apos;d like this for your site, that&apos;s the whole
        product.
      </p>
    </section>
  );
}

function Section({
  id,
  tag,
  title,
  children,
}: {
  id: string;
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="dashed-bottom px-6 py-16 sm:py-20">
      <div className="mb-10 flex items-baseline gap-4">
        <span className="font-mono text-[11px] text-[var(--subtle)]">
          {tag}
        </span>
        <h2 className="display-md">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-[12.5px] text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-[var(--subtle)]">— design.md, rendered</span>
        </div>
        <span className="text-[var(--subtle)]">© 2026 getdesign</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* 01 — Logo                                                           */
/* ------------------------------------------------------------------ */

function LogoSection() {
  const [replayKey, setReplayKey] = useState(0);
  return (
    <div className="space-y-8">
      <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
        <LogoTile label="Lockup">
          <Logo size="lg" />
        </LogoTile>
        <LogoTile label="Mark">
          <Mark size={44} />
        </LogoTile>
        <LogoTile label="Wordmark">
          <Logo variant="wordmark" size="lg" />
        </LogoTile>
        <LogoTile label="Mono">
          <span className="text-foreground">
            <Mark size={44} mono />
          </span>
        </LogoTile>
        <LogoTile label="On accent" tone="accent">
          <span className="text-[#0a0a0b]">
            <Mark size={44} mono />
          </span>
        </LogoTile>
        <LogoTile label="On light" tone="light">
          <span className="text-[#0a0a0b]">
            <Logo size="lg" />
          </span>
        </LogoTile>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
        <div className="bg-[var(--surface-100)] p-8">
          <Caption>Animated — hero variant</Caption>
          <div className="mt-6 flex items-center gap-6">
            <div key={replayKey}>
              <Logo variant="animated" size="xl" />
            </div>
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="btn-ghost inline-flex h-8 items-center rounded-md px-3 text-[12px]"
            >
              Replay
            </button>
          </div>
        </div>
        <div className="bg-[var(--surface-100)] p-8">
          <Caption>Clear space</Caption>
          <div className="mt-6 flex items-center justify-center rounded-md border border-dashed border-[var(--border-strong)] p-6">
            <div className="relative">
              <span className="pointer-events-none absolute -inset-4 rounded-md border border-dashed border-[var(--accent)]/40" />
              <Logo size="lg" />
            </div>
          </div>
          <p className="mt-4 text-[12px] text-muted">
            Minimum clear space equals the height of the mark on all sides.
          </p>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
        <Rule kind="do" text="Pair the mark with the split wordmark on primary surfaces." />
        <Rule kind="dont" text="Don't recolor the brackets — they always inherit currentColor." />
        <Rule kind="do" text="Use the mono variant on photography, OG cards, and accent fills." />
        <Rule kind="dont" text="Don't stretch, rotate, or add effects to the mark." />
      </div>
    </div>
  );
}

function LogoTile({
  label,
  tone = "dark",
  children,
}: {
  label: string;
  tone?: "dark" | "light" | "accent";
  children: React.ReactNode;
}) {
  const bg =
    tone === "light"
      ? "bg-[#ededee]"
      : tone === "accent"
        ? "bg-[var(--accent)]"
        : "bg-[var(--surface-100)]";
  return (
    <div className={`${bg} flex min-h-[160px] flex-col justify-between p-6`}>
      <Caption
        tone={tone === "dark" ? "dark" : "inverse"}
      >
        {label}
      </Caption>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

function Rule({ kind, text }: { kind: "do" | "dont"; text: string }) {
  return (
    <div className="bg-[var(--surface-100)] p-5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium ${
            kind === "do"
              ? "bg-[var(--accent)] text-[#0a0a0b]"
              : "border border-[var(--danger)] text-[var(--danger)]"
          }`}
        >
          {kind === "do" ? "✓" : "×"}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--subtle)]">
          {kind === "do" ? "Do" : "Don't"}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-foreground">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Palette                                                        */
/* ------------------------------------------------------------------ */

const PALETTE: Array<{
  name: string;
  var: string;
  fallback: string;
  role: string;
}> = [
  { name: "Background", var: "--background", fallback: "#0a0a0b", role: "Page canvas" },
  { name: "Surface 100", var: "--surface-100", fallback: "#101012", role: "Cards, tiles" },
  { name: "Surface 200", var: "--surface-200", fallback: "#141418", role: "Hover, inputs" },
  { name: "Surface 300", var: "--surface-300", fallback: "#1a1a20", role: "Elevated" },
  { name: "Foreground", var: "--foreground", fallback: "#ededee", role: "Primary text" },
  { name: "Muted", var: "--muted", fallback: "rgba(237,237,238,0.6)", role: "Body copy" },
  { name: "Subtle", var: "--subtle", fallback: "rgba(237,237,238,0.38)", role: "Meta, labels" },
  { name: "Faint", var: "--faint", fallback: "rgba(237,237,238,0.12)", role: "Dashed rails" },
  { name: "Border", var: "--border", fallback: "rgba(255,255,255,0.07)", role: "Hairlines" },
  { name: "Border strong", var: "--border-strong", fallback: "rgba(255,255,255,0.14)", role: "Focus, chips" },
  { name: "Accent", var: "--accent", fallback: "#a3e635", role: "Primary accent" },
  { name: "Accent dim", var: "--accent-dim", fallback: "#65a30d", role: "Accent pressed" },
  { name: "Accent glow", var: "--accent-glow", fallback: "rgba(163,230,53,0.18)", role: "Halos, auras" },
  { name: "Danger", var: "--danger", fallback: "#f87171", role: "Errors only" },
];

function PaletteSection() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {PALETTE.map((c) => (
        <Swatch key={c.var} {...c} />
      ))}
    </div>
  );
}

function Swatch({
  name,
  var: cssVar,
  fallback,
  role,
}: {
  name: string;
  var: string;
  fallback: string;
  role: string;
}) {
  const copy = useCopy();
  const textTone =
    cssVar === "--accent" || cssVar === "--accent-dim" || cssVar === "--foreground"
      ? "dark"
      : "light";
  return (
    <button
      type="button"
      onClick={() => copy.copy(`var(${cssVar})`)}
      className="group relative flex flex-col bg-[var(--surface-100)] p-5 text-left transition-colors hover:bg-[var(--surface-200)]"
    >
      <div
        className="relative h-20 overflow-hidden rounded-md border border-[var(--border)]"
        style={{ background: `var(${cssVar}, ${fallback})` }}
      >
        <span
          className={`absolute bottom-2 right-2 font-mono text-[10px] ${
            textTone === "dark" ? "text-[#0a0a0b]/70" : "text-[var(--subtle)]"
          }`}
        >
          {fallback}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13px] text-foreground">{name}</span>
        <span className="font-mono text-[10.5px] text-[var(--subtle)] transition-colors group-hover:text-[var(--accent)]">
          {copy.is(`var(${cssVar})`) ? "copied" : "copy"}
        </span>
      </div>
      <span className="mt-1 font-mono text-[11px] text-[var(--accent)]">
        {cssVar}
      </span>
      <span className="mt-1 text-[11.5px] text-muted">{role}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 03 — Typography                                                     */
/* ------------------------------------------------------------------ */

function TypographySection() {
  return (
    <div className="space-y-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
      <Specimen
        tag=".display-hero"
        spec="clamp(36px, 6vw, 64px) / 1.04 / -0.035em / 500"
      >
        <span className="display-hero">
          The design system for any URL
          <span className="text-[var(--accent)]">.</span>
        </span>
      </Specimen>
      <Specimen
        tag=".display-md"
        spec="clamp(22px, 2.8vw, 32px) / 1.15 / -0.025em / 500"
      >
        <span className="display-md">Five surfaces, one agent.</span>
      </Specimen>
      <Specimen tag="body" spec="14.5px / 1.6 / -0.005em / 400">
        <p className="max-w-[620px] text-[14.5px] leading-relaxed text-muted">
          getdesign opens a site in a real browser, extracts palette,
          typography, and components, and returns a production-grade
          design.md — grounded in the site&apos;s actual CSS.
        </p>
      </Specimen>
      <Specimen tag=".eyebrow" spec="12px / 1.4 / -0.01em / muted">
        <span className="eyebrow">OWN YOUR DESIGN SYSTEM</span>
      </Specimen>
      <Specimen tag="mono" spec="JetBrains Mono / 12px / tnum">
        <span className="font-mono text-[12px] text-[var(--accent)]">
          npx @getdesign/cli https://stripe.com
        </span>
      </Specimen>
    </div>
  );
}

function Specimen({
  tag,
  spec,
  children,
}: {
  tag: string;
  spec: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 bg-[var(--surface-100)] p-6 md:grid-cols-[180px_1fr] md:items-baseline md:gap-8">
      <div>
        <div className="font-mono text-[11px] text-[var(--accent)]">{tag}</div>
        <div className="mt-1 font-mono text-[10.5px] text-[var(--subtle)]">
          {spec}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Spacing                                                        */
/* ------------------------------------------------------------------ */

const SPACES = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64];
const RADII: Array<{ name: string; value: string }> = [
  { name: "sm", value: "4px" },
  { name: "md", value: "8px" },
  { name: "lg", value: "12px" },
  { name: "xl", value: "16px" },
  { name: "full", value: "9999px" },
];

function SpacingSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-6">
        <Caption>Spacing scale · 4px base</Caption>
        <div className="mt-6 space-y-2">
          {SPACES.map((s) => (
            <div key={s} className="flex items-center gap-4">
              <span className="w-10 font-mono text-[11px] text-[var(--subtle)]">
                {s}
              </span>
              <span
                className="block h-2 rounded-sm bg-[var(--accent)]"
                style={{ width: `${s * 2}px` }}
              />
              <span className="font-mono text-[10.5px] text-[var(--subtle)]">
                {s}px
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-6">
        <Caption>Radius</Caption>
        <div className="mt-6 grid grid-cols-5 gap-3">
          {RADII.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <span
                className="h-14 w-14 border border-[var(--border-strong)] bg-[var(--surface-200)]"
                style={{ borderRadius: r.value }}
              />
              <span className="font-mono text-[10.5px] text-[var(--subtle)]">
                {r.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 05 — Components                                                     */
/* ------------------------------------------------------------------ */

function ComponentsSection() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
      <ComponentTile name="Button · primary">
        <button className="btn-primary inline-flex h-9 items-center rounded-md px-4 text-[13px]">
          Join the waitlist
        </button>
      </ComponentTile>
      <ComponentTile name="Button · ghost">
        <button className="btn-ghost inline-flex h-9 items-center rounded-md px-4 text-[13px]">
          Read the docs
        </button>
      </ComponentTile>
      <ComponentTile name="Button · accent">
        <button className="btn-accent inline-flex h-9 items-center rounded-md px-4 text-[13px] font-medium">
          Run getdesign
        </button>
      </ComponentTile>
      <ComponentTile name="Input · compact">
        <div className="flex w-full max-w-[360px] items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-100)] p-1 pl-3">
          <span className="font-mono text-[11px] text-[var(--subtle)]">{">"}</span>
          <input
            placeholder="https://stripe.com"
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none"
          />
          <button className="btn-accent inline-flex h-7 items-center rounded px-3 text-[11.5px] font-medium">
            Run
          </button>
        </div>
      </ComponentTile>
      <ComponentTile name="Chip · status">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Shipping Q2 2026
        </span>
      </ComponentTile>
      <ComponentTile name="Nav link · active">
        <span className="nav-link is-active pb-[10px] text-[12.5px]">
          SURFACES
        </span>
      </ComponentTile>
      <ComponentTile name="Dashed rail">
        <div className="relative h-20 w-full max-w-[320px]">
          <div className="dashed-frame absolute inset-0" />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-[var(--subtle)]">
            dashed-frame
          </span>
        </div>
      </ComponentTile>
      <ComponentTile name="Code token">
        <div className="flex flex-col gap-1 font-mono text-[12px]">
          <span>
            <span className="tok-key">const</span>{" "}
            <span className="tok-var">design</span>{" "}
            <span className="tok-punc">=</span>{" "}
            <span className="tok-fn">await</span>{" "}
            <span className="tok-fn">getDesign</span>
            <span className="tok-punc">(</span>
            <span className="tok-str">&quot;stripe.com&quot;</span>
            <span className="tok-punc">);</span>
          </span>
          <span className="tok-com">// → design.md</span>
        </div>
      </ComponentTile>
    </div>
  );
}

function ComponentTile({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[140px] flex-col bg-[var(--surface-100)] p-5">
      <Caption>{name}</Caption>
      <div className="mt-6 flex flex-1 items-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 06 — Motion                                                         */
/* ------------------------------------------------------------------ */

const EASINGS = [
  {
    name: "standard",
    curve: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    note: "UI transitions, nav, hovers. ~220ms.",
  },
  {
    name: "draw-on",
    curve: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    note: "Logo + brackets. 520ms stagger 80ms.",
  },
  {
    name: "pulse",
    curve: "ease-in-out",
    note: "Status dots. 1.4s loop, opacity 1 → 0.35.",
  },
];

function MotionSection() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
      {EASINGS.map((e) => (
        <div key={e.name} className="bg-[var(--surface-100)] p-6">
          <Caption>{e.name}</Caption>
          <div className="mt-6 flex h-12 items-center gap-3">
            {e.name === "pulse" ? (
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
            ) : (
              <MotionDemo easing={e.curve} />
            )}
          </div>
          <p className="mt-6 font-mono text-[10.5px] text-[var(--accent)]">
            {e.curve}
          </p>
          <p className="mt-1 text-[12px] text-muted">{e.note}</p>
        </div>
      ))}
    </div>
  );
}

function MotionDemo({ easing }: { easing: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="inline-block h-2 rounded-full bg-[var(--accent)]"
      style={{
        width: on ? 96 : 12,
        transition: `width 520ms ${easing}`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* 07 — Voice                                                          */
/* ------------------------------------------------------------------ */

const VOICE: Array<{ do: string; dont: string }> = [
  {
    do: "The design system for any URL.",
    dont: "The revolutionary AI-powered design platform.",
  },
  {
    do: "Paste a URL. Get a design.md.",
    dont: "Unlock the power of intelligent design extraction.",
  },
  {
    do: "Five surfaces, one agent.",
    dont: "Our robust multi-platform AI ecosystem.",
  },
  {
    do: "Grounded in the site's actual CSS.",
    dont: "Leveraging cutting-edge web analysis technology.",
  },
];

function VoiceSection() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="grid grid-cols-[72px_1fr_1fr] border-b border-[var(--border)] bg-[var(--surface-200)] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--subtle)]">
        <span>#</span>
        <span className="text-[var(--accent)]">Do</span>
        <span className="text-[var(--danger)]">Don&apos;t</span>
      </div>
      {VOICE.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[72px_1fr_1fr] border-b border-[var(--border)] bg-[var(--surface-100)] px-5 py-5 last:border-b-0"
        >
          <span className="font-mono text-[11px] text-[var(--subtle)]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-[13.5px] text-foreground">{row.do}</span>
          <span className="text-[13.5px] text-[var(--subtle)] line-through decoration-[var(--danger)]/50">
            {row.dont}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function Caption({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "inverse";
}) {
  return (
    <span
      className={`font-mono text-[10.5px] uppercase tracking-[0.14em] ${
        tone === "dark" ? "text-[var(--subtle)]" : "text-[#0a0a0b]/70"
      }`}
    >
      {children}
    </span>
  );
}

function useCopy() {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => setValue(null), 1200);
    return () => clearTimeout(t);
  }, [value]);
  return {
    copy: async (v: string) => {
      try {
        await navigator.clipboard.writeText(v);
        setValue(v);
      } catch {
        // swallow — clipboard may be unavailable in some contexts
      }
    },
    is: (v: string) => value === v,
  };
}
