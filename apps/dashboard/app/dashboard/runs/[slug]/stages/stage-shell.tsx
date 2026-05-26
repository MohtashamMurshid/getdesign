"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Stage({
  active,
  className,
  children,
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden={!active}
      className={cn(
        "absolute inset-0 transition-opacity duration-500 ease-out",
        active ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
