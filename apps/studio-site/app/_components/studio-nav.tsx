import Link from "next/link";

import {
  SITE_GETDESIGN_URL,
  SITE_GITHUB_URL,
  SITE_RELEASES_URL,
} from "../_lib/site";
import { formatCount } from "../_lib/releases";
import { DownloadButtonComingSoon } from "./download-button-coming-soon";
import { GitHubIcon, StarIcon } from "./icons";
import { StudioWordmark } from "./studio-mark";

const NAV_IN_PAGE: { href: string; label: string }[] = [
  { href: "#studio", label: "Studio" },
  { href: "#providers", label: "Providers" },
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#get-started", label: "Get started" },
];

const NAV_EXTERNAL: { href: string; label: string }[] = [
  { href: SITE_GETDESIGN_URL, label: "getdesign" },
  { href: SITE_RELEASES_URL, label: "Releases" },
];

type StudioNavProps = {
  stars: number;
};

export function StudioNav({ stars }: StudioNavProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-3 px-5 md:gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <StudioWordmark />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-x-0.5 overflow-x-auto whitespace-nowrap md:flex lg:gap-x-1"
          aria-label="Page sections"
        >
          {NAV_IN_PAGE.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link shrink-0 rounded-md px-2 py-2 text-[0.8125rem] font-medium lg:px-2.5 lg:text-[0.875rem]"
            >
              {item.label}
            </a>
          ))}
          {NAV_EXTERNAL.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="nav-link shrink-0 rounded-md px-2 py-2 text-[0.8125rem] font-medium lg:px-2.5 lg:text-[0.875rem]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 pr-1">
          <a
            href={SITE_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-surface-muted sm:inline-flex"
            aria-label={`${stars} GitHub stars`}
          >
            <GitHubIcon />
            <StarIcon className="opacity-70" />
            <span>{formatCount(stars || 0)}</span>
          </a>
          <DownloadButtonComingSoon variant="sm" />
        </div>
      </div>
    </header>
  );
}