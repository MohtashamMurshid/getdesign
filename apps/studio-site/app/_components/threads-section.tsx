import {
  SiClaude,
  SiCursor,
  SiGooglegemini,
} from "@icons-pack/react-simple-icons";

import { OpenAIIcon } from "./icons";

type Thread = {
  title: string;
  subtitle: string;
  age: string;
  active?: boolean;
  status?: "branched" | "running" | "idle";
  icon: React.ReactNode;
};

const THREADS: Thread[] = [
  {
    title: "Northwind rebrand",
    subtitle: "launch deck · 12 slides",
    age: "now",
    active: true,
    status: "running",
    icon: <SiClaude size={14} />,
  },
  {
    title: "Pricing page mockups",
    subtitle: "tokens.json + 3 variants",
    age: "6m",
    status: "branched",
    icon: <OpenAIIcon className="size-[14px]" />,
  },
  {
    title: "Brand audit · linear.app",
    subtitle: "design.md · palette + type",
    age: "25m",
    status: "branched",
    icon: <SiGooglegemini size={14} />,
  },
  {
    title: "Onboarding prototype",
    subtitle: "freeform · 4 frames",
    age: "36m",
    status: "idle",
    icon: <SiCursor size={14} />,
  },
];

export function ThreadsSection() {
  return (
    <section
      id="workflow"
      className="section-rule w-full scroll-mt-20 py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="display-section max-w-[18ch] text-foreground">
          Many decks at once.
          <br />
          Lose nothing.
        </h2>
        <p className="mt-4 max-w-[58ch] text-[0.95rem] leading-relaxed text-muted">
          Run Claude, Codex, and Gemini across multiple projects, all in one
          window. Every artifact and thread stays exactly where you left it.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
          {THREADS.map((t, i) => (
            <ThreadRow
              key={t.title}
              thread={t}
              isLast={i === THREADS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ThreadRow({ thread, isLast }: { thread: Thread; isLast: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 ${
        isLast ? "" : "border-b border-border"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-foreground">
          {thread.icon}
          {thread.active && (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-surface" />
          )}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[0.92rem] font-medium tracking-tight text-foreground">
            {thread.title}
          </div>
          <div className="truncate text-[0.78rem] text-subtle">
            {thread.subtitle}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[0.72rem] text-subtle">
        {thread.status === "running" && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            running
          </span>
        )}
        {thread.status === "branched" && (
          <span className="inline-flex items-center gap-1">
            <BranchIcon />
            branch
          </span>
        )}
        <span className="font-mono">{thread.age}</span>
      </div>
    </div>
  );
}

function BranchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="9" r="2" />
      <path d="M6 7v10" />
      <path d="M18 11v1c0 1.5-.5 3-2.5 3.5l-3 1" />
    </svg>
  );
}
