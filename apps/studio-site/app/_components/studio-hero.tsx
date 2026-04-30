import {
  SiAnthropic,
  SiClaude,
  SiGooglegemini,
} from "@icons-pack/react-simple-icons";

import { SITE_GITHUB_URL } from "../_lib/site";
import { DownloadButtonComingSoon } from "./download-button-coming-soon";
import { GitHubIcon, OpenAIIcon } from "./icons";

export function StudioHero() {
  return (
    <section className="relative w-full pt-16 pb-10 md:pt-24 md:pb-14">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <div className="fade-in-up flex items-center gap-2.5">
          <ProviderPill label="Claude">
            <SiClaude size={16} />
          </ProviderPill>
          <ProviderPill label="ChatGPT / Codex">
            <OpenAIIcon />
          </ProviderPill>
          <ProviderPill label="Gemini / Antigravity">
            <SiGooglegemini size={16} />
          </ProviderPill>
          <ProviderPill label="Anthropic API">
            <SiAnthropic size={16} />
          </ProviderPill>
          <span className="ml-1 hidden text-[0.78rem] text-subtle sm:inline">
            Bring your own subscription
          </span>
        </div>

        <h1 className="fade-in-up delay-1 mt-10 text-[clamp(28px,4.6vw,52px)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground">
          The open-source AI design partner.
        </h1>

        <p className="fade-in-up delay-2 mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-muted md:text-base">
          getdesign Studio lets you collaborate with AI to create polished
          visual work&mdash;designs, prototypes, slides, one-pagers, and more.
          It is open source and runs with the AI subscriptions you already pay
          for.
        </p>

        <div className="fade-in-up delay-3 mt-8 flex flex-wrap items-center gap-3">
          <DownloadButtonComingSoon id="download" />
          <a
            href={SITE_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            <GitHubIcon /> Star on GitHub
          </a>
        </div>

        <p className="fade-in-up delay-4 mt-5 text-[0.85rem] text-subtle">
          Downloads coming soon &middot; macOS, Windows, and Linux &middot;
          free and open source
        </p>
      </div>
    </section>
  );
}

type ProviderPillProps = {
  label: string;
  children: React.ReactNode;
};

function ProviderPill({ label, children }: ProviderPillProps) {
  return (
    <span className="icon-pill" aria-label={label} title={label}>
      {children}
    </span>
  );
}
