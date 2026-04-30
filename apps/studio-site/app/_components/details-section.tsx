import { StudioMark } from "./studio-mark";

export function DetailsSection() {
  return (
    <section
      id="features"
      className="section-rule w-full scroll-mt-20 py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="display-section max-w-[20ch] text-foreground">
          The details that make decks ship.
        </h2>
        <p className="mt-4 max-w-[58ch] text-[0.95rem] leading-relaxed text-muted">
          Every surface is tuned for flow. Live HTML preview, one-click PDF
          and PPTX, and an artifact tree the moment your agent finishes.
        </p>

        {/* Row 1: copy left, mock right */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="eyebrow">Export</p>
            <h3 className="mt-3 text-[1.2rem] font-medium tracking-tight text-foreground md:text-[1.35rem]">
              One-click PDF and PPTX
            </h3>
            <p className="mt-3 max-w-[44ch] text-[0.9rem] leading-relaxed text-muted">
              Studio renders your HTML deck in a sandboxed Chromium and emits
              pixel-perfect PDF or editable, pptx-safe PowerPoint &mdash;
              ready for the meeting at 4 p.m.
            </p>
          </div>
          <ExportMock />
        </div>

        {/* Row 2: mock left, copy right */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <ArtifactsMock />
          <div>
            <p className="eyebrow">Artifacts</p>
            <h3 className="mt-3 text-[1.2rem] font-medium tracking-tight text-foreground md:text-[1.35rem]">
              HTML-native, file-tree first
            </h3>
            <p className="mt-3 max-w-[44ch] text-[0.9rem] leading-relaxed text-muted">
              Every slide, prototype, and tweak lands as a real file. Open the
              folder, diff in git, edit by hand &mdash; Studio doesn&apos;t
              hide your work behind a black box.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExportMock() {
  return (
    <div className="mock-card">
      <div className="mock-inner">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 text-[0.72rem] text-muted">
            <StudioMark size={14} />
            <span className="font-mono">northwind / launch-deck.html</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[0.65rem] text-muted">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Ready
          </span>
        </div>
        <div className="px-3 py-3">
          <div className="text-[0.78rem] font-medium text-foreground">
            Export this artifact
          </div>
          <div className="mt-1 text-[0.7rem] text-subtle">
            12 slides &middot; freeform &middot; 1.4 MB
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border bg-background px-3 py-2.5">
          <span className="flex items-center justify-center gap-1.5 rounded-md border border-border-strong bg-foreground px-2 py-1.5 text-[0.74rem] text-background">
            <FileIcon /> HTML
          </span>
          <span className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-[0.74rem] text-foreground">
            <FileIcon /> PDF
          </span>
          <span className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-[0.74rem] text-foreground">
            <FileIcon /> PPTX
          </span>
        </div>
      </div>
    </div>
  );
}

function ArtifactsMock() {
  const files: { name: string; meta: string; type: "html" | "json" | "md" }[] =
    [
      { name: "01-hero.html", meta: "northwind ↳ 1m", type: "html" },
      { name: "02-credibility.html", meta: "northwind ↳ 4m", type: "html" },
      { name: "tokens.json", meta: "northwind ↳ 12m", type: "json" },
      { name: "design.md", meta: "northwind ↳ 1h", type: "md" },
    ];
  return (
    <div className="mock-card">
      <div className="mock-inner">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[0.7rem] text-subtle">
          <span className="font-mono">project / artifacts</span>
          <span>{files.length} files</span>
        </div>
        <ul>
          {files.map((f, i) => (
            <li
              key={f.name}
              className={`flex items-center justify-between gap-3 px-3 py-2 text-[0.78rem] ${
                i !== files.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="flex items-center gap-2 text-foreground">
                <FileBadge type={f.type} />
                {f.name}
              </span>
              <span className="font-mono text-[0.7rem] text-subtle">
                {f.meta}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function FileBadge({ type }: { type: "html" | "json" | "md" }) {
  const label = type.toUpperCase();
  const tone =
    type === "html"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : type === "json"
      ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  return (
    <span
      className={`inline-flex h-[18px] items-center rounded px-1.5 font-mono text-[0.62rem] ${tone}`}
    >
      {label}
    </span>
  );
}
