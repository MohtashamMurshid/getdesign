import { SITE_COPYRIGHT, SITE_GITHUB_URL, SITE_TAGLINE } from "../_lib/site";
import { Logo } from "./logo";

type SiteFooterProps = {
  variant?: "marketing" | "design";
};

export function SiteFooter({ variant = "marketing" }: SiteFooterProps) {
  const isDesign = variant === "design";

  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-[12.5px] text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-[var(--subtle)]">
            {isDesign ? "— design.md, rendered" : `— ${SITE_TAGLINE}`}
          </span>
        </div>

        {isDesign ? (
          <span className="text-[var(--subtle)]">{SITE_COPYRIGHT}</span>
        ) : (
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
              href={SITE_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <span className="text-[var(--subtle)]">{SITE_COPYRIGHT}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
