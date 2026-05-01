import { SiClaude } from "@icons-pack/react-simple-icons";

import { OpenAIIcon } from "./icons";

type Provider = {
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
};

/** Matches Anthropic Claude mark (`apps/studio/public/claude.svg`). */
const CLAUDE_BRAND = "#D97757";
/** ChatGPT / Codex association (`simple-icons` OpenAI green). */
const OPENAI_CHAT_BRAND = "#10A37F";

const PROVIDERS: Provider[] = [
  {
    name: "Claude",
    badge: "Pro / Max",
    description:
      "Opus, Sonnet, and Haiku — sign in with your existing Claude Pro or Max plan.",
    icon: <SiClaude color={CLAUDE_BRAND} size={18} />,
  },
  {
    name: "Codex",
    badge: "ChatGPT Plus / Pro",
    description:
      "GPT-5.x, Codex, and o-series — whatever your ChatGPT subscription unlocks.",
    icon: (
      <span style={{ color: OPENAI_CHAT_BRAND }}>
        <OpenAIIcon className="size-[18px]" />
      </span>
    ),
  },
  {
    name: "Gemini",
    badge: "Google AI Pro",
    description:
      "Gemini 3.x Pro and Flash, on your Google AI Pro or Ultra subscription.",
    icon: <BrandSvgImg src="/providers/gemini.svg" />,
  },
  {
    name: "Antigravity",
    badge: "Google",
    description:
      "Sign in with Google Antigravity to use the agent inside Studio.",
    icon: <BrandSvgImg src="/providers/antigravity.svg" />,
  },
  {
    name: "Custom (BYOK)",
    badge: "Anthropic / OpenAI / OpenRouter",
    description:
      "Bring your own API key. Ollama, LM Studio, vLLM, and any OpenAI-compatible endpoint.",
    icon: (
      <span className="text-amber-600 dark:text-amber-400">
        <KeyIcon />
      </span>
    ),
  },
  {
    name: "Cursor",
    badge: "Coming soon",
    description:
      "Bring your Cursor subscription into Studio for design and decks.",
    icon: <BrandSvgImg src="/providers/cursor.svg" invertOnDark />,
    comingSoon: true,
  },
];

export function ProvidersSection() {
  return (
    <section
      id="providers"
      className="section-rule w-full scroll-mt-20 py-20 md:py-28"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 text-center">
        <p className="eyebrow">Providers</p>
        <h2 className="display-section mt-4 max-w-[18ch] text-balance text-foreground">
          Use what you already pay for.
        </h2>
        <p className="mt-4 max-w-[58ch] text-balance text-[0.95rem] leading-relaxed text-muted">
          The same kind of polished visual work&mdash;designed and prototyped
          with AI&mdash;but with no walled garden. Plug in Claude, Codex,
          Gemini, or your own key.
        </p>

        <div className="mt-12 grid w-full grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2 md:text-left">
          {PROVIDERS.map((p, i) => (
            <ProviderRow key={p.name} provider={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderRow({
  provider,
  index,
}: {
  provider: Provider;
  index: number;
}) {
  return (
    <div
      className={`flex flex-col gap-3 border-t border-border py-7 ${
        index >= 2 ? "" : "md:border-t"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface">
            {provider.icon}
          </span>
          <span className="text-[0.95rem] font-medium tracking-tight text-foreground">
            {provider.name}
          </span>
        </div>
        <span className="font-mono text-[0.7rem] text-subtle">
          {provider.badge}
        </span>
      </div>
      <p className="max-w-[58ch] text-[0.85rem] leading-relaxed text-muted">
        {provider.description}
      </p>
    </div>
  );
}

function BrandSvgImg({
  src,
  invertOnDark,
}: {
  src: string;
  invertOnDark?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- flat SVG assets from `/public`
    <img
      src={src}
      alt=""
      width={18}
      height={18}
      decoding="async"
      className={`size-[18px] shrink-0 ${invertOnDark ? "dark:brightness-0 dark:invert" : ""}`}
      aria-hidden
    />
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="14" r="3.2" />
      <path d="M10.4 11.6 21 1m-4 4 3 3m-6-1 3 3" />
    </svg>
  );
}
