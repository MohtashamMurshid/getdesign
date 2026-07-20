import Link from "next/link";

import { cn } from "@/lib/utils";

type DocsLinkCardProps = {
  href: string;
  title: string;
  description: string;
  external?: boolean;
  className?: string;
};

export function DocsLinkCard({
  href,
  title,
  description,
  external = true,
  className,
}: DocsLinkCardProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cn(
        "block rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
