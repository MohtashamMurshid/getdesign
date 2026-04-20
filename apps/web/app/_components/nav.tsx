"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SITE_GITHUB_URL } from "../_lib/site";
import { Logo } from "./logo";

type NavLink = {
  id: string;
  label: string;
  href?: string;
  external?: boolean;
};

const LINKS: NavLink[] = [
  { id: "how", label: "HOW IT WORKS" },
  { id: "surfaces", label: "SURFACES" },
  { id: "design", label: "DESIGN", href: "/design", external: true },
  { id: "cta", label: "WAITLIST" },
];

export default function Nav() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const targets = LINKS.filter((link) => !link.external)
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );

        if (visibleEntries[0]) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-40% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="dashed-bottom sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center">
          <Logo size="md" />
        </a>

        <nav className="hidden items-center gap-8 text-[12.5px] md:flex">
          {LINKS.map((link) => {
            const isActive = link.external
              ? pathname === link.href
              : pathname === "/" && activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.external ? link.href : `/#${link.id}`}
                className={`nav-link pb-[18px] ${isActive ? "is-active" : ""}`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <a
          href={SITE_GITHUB_URL}
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
