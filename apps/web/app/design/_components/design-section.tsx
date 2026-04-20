import type { ReactNode } from "react";

type DesignSectionProps = {
  id: string;
  tag: string;
  title: string;
  children: ReactNode;
};

export function DesignSection({
  id,
  tag,
  title,
  children,
}: DesignSectionProps) {
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
