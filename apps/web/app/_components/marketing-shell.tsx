import type { ReactNode } from "react";

import Nav from "./nav";

type MarketingShellProps = {
  children: ReactNode;
  footer: ReactNode;
  mainClassName?: string;
};

export function MarketingShell({
  children,
  footer,
  mainClassName = "mx-auto max-w-6xl px-6",
}: MarketingShellProps) {
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
        <main className={mainClassName}>{children}</main>
        {footer}
      </div>
    </div>
  );
}
