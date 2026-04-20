"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { id: "how", label: "HOW IT WORKS" },
  { id: "surfaces", label: "SURFACES" },
  { id: "cta", label: "WAITLIST" },
];

export default function Nav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        // trigger when a section crosses the middle of the viewport
        rootMargin: "-40% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <header className="dashed-bottom sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[14px] font-medium tracking-tight">
            getdesign
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-[12.5px] md:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`nav-link pb-[18px] ${
                active === l.id ? "is-active" : ""
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost inline-flex h-8 items-center gap-2 rounded-md px-3 text-[12.5px] transition-transform hover:-translate-y-[1px]"
        >
          <GithubIcon />
          GitHub
        </a>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--surface-200)]">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
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
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.22 9.17 7.69 10.65.56.1.77-.24.77-.54 0-.27-.01-1.17-.02-2.12-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.16-1.46 3.1-1.16 3.1-1.16.62 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.03 0 4.32-2.64 5.27-5.15 5.55.4.34.76 1.02.76 2.06 0 1.48-.01 2.67-.01 3.03 0 .3.2.65.78.54 4.47-1.48 7.69-5.69 7.69-10.65C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}
