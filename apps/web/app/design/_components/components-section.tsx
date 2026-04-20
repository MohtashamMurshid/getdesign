import { ComponentTile } from "./design-primitives";

export function ComponentsSection() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
      <ComponentTile name="Button · primary">
        <button className="btn-primary inline-flex h-9 items-center rounded-md px-4 text-[13px]">
          Join the waitlist
        </button>
      </ComponentTile>
      <ComponentTile name="Button · ghost">
        <button className="btn-ghost inline-flex h-9 items-center rounded-md px-4 text-[13px]">
          Read the docs
        </button>
      </ComponentTile>
      <ComponentTile name="Button · accent">
        <button className="btn-accent inline-flex h-9 items-center rounded-md px-4 text-[13px] font-medium">
          Run getdesign
        </button>
      </ComponentTile>
      <ComponentTile name="Input · compact">
        <div className="flex w-full max-w-[360px] items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-100)] p-1 pl-3">
          <span className="font-mono text-[11px] text-[var(--subtle)]">{">"}</span>
          <input
            placeholder="https://stripe.com"
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none"
          />
          <button className="btn-accent inline-flex h-7 items-center rounded px-3 text-[11.5px] font-medium">
            Run
          </button>
        </div>
      </ComponentTile>
      <ComponentTile name="Chip · status">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Shipping Q2 2026
        </span>
      </ComponentTile>
      <ComponentTile name="Nav link · active">
        <span className="nav-link is-active pb-[10px] text-[12.5px]">
          SURFACES
        </span>
      </ComponentTile>
      <ComponentTile name="Dashed rail">
        <div className="relative h-20 w-full max-w-[320px]">
          <div className="dashed-frame absolute inset-0" />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-[var(--subtle)]">
            dashed-frame
          </span>
        </div>
      </ComponentTile>
      <ComponentTile name="Code token">
        <div className="flex flex-col gap-1 font-mono text-[12px]">
          <span>
            <span className="tok-key">const</span>{" "}
            <span className="tok-var">design</span>{" "}
            <span className="tok-punc">=</span>{" "}
            <span className="tok-fn">await</span>{" "}
            <span className="tok-fn">getDesign</span>
            <span className="tok-punc">(</span>
            <span className="tok-str">&quot;stripe.com&quot;</span>
            <span className="tok-punc">);</span>
          </span>
          <span className="tok-com">// → design.md</span>
        </div>
      </ComponentTile>
    </div>
  );
}
