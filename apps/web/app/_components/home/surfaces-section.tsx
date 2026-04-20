const SURFACE_ITEMS = [
  {
    tag: "01",
    title: "Web",
    domain: "getdesign.app",
    body: "Streaming chat UI with a live design.md artifact panel.",
  },
  {
    tag: "02",
    title: "API",
    domain: "api.getdesign.app",
    body: "GET /?url=… returns text/markdown. No auth in v1.",
  },
  {
    tag: "03",
    title: "CLI",
    domain: "npx @getdesign/cli",
    body: "One-shot and interactive REPL. Single Bun binary.",
  },
  {
    tag: "04",
    title: "SDK",
    domain: "npm i @getdesign/sdk",
    body: "Typed client. getDesign(url) + streamDesign(url).",
  },
  {
    tag: "05",
    title: "Skill",
    domain: "skills add MohtashamMurshid/getdesign",
    body: "Portable SKILL.md. Runs inside Claude Code, Codex, Cursor, using your agent's own tools.",
  },
] as const;

export function SurfacesSection() {
  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="display-md">Five surfaces, one agent.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Four surfaces call the same agent core. The fifth runs inside yours.
        </p>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {SURFACE_ITEMS.map((item) => (
          <div
            key={item.tag}
            className="group bg-[var(--surface-100)] p-5 transition-colors hover:bg-[var(--surface-200)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--subtle)]">
                {item.tag}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--faint)] transition-colors group-hover:bg-[var(--accent)]" />
            </div>
            <div className="mt-8 text-[18px] tracking-tight text-foreground">
              {item.title}
            </div>
            <div className="mt-1 font-mono text-[11.5px] text-[var(--accent)]">
              {item.domain}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
