import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DemoChromeProps = {
  label: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
};

export function DemoChrome({
  label,
  children,
  className,
  footer,
}: DemoChromeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="min-h-[280px]">{children}</div>
      {footer ? (
        <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
