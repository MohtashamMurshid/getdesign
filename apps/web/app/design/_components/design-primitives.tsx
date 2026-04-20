import type { ReactNode } from "react";

type CaptionProps = {
  children: ReactNode;
  tone?: "dark" | "inverse";
};

export function Caption({ children, tone = "dark" }: CaptionProps) {
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

type RuleProps = {
  kind: "do" | "dont";
  text: string;
};

export function Rule({ kind, text }: RuleProps) {
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

type SpecimenProps = {
  tag: string;
  spec: string;
  children: ReactNode;
};

export function Specimen({ tag, spec, children }: SpecimenProps) {
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

type ComponentTileProps = {
  name: string;
  children: ReactNode;
};

export function ComponentTile({ name, children }: ComponentTileProps) {
  return (
    <div className="flex min-h-[140px] flex-col bg-[var(--surface-100)] p-5">
      <Caption>{name}</Caption>
      <div className="mt-6 flex flex-1 items-center">{children}</div>
    </div>
  );
}
