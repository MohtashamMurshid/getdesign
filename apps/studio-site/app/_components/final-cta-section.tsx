import {
  SiClaude,
  SiCursor,
  SiGooglegemini,
} from "@icons-pack/react-simple-icons";

import { DownloadButtonComingSoon } from "./download-button-coming-soon";
import { OpenAIIcon } from "./icons";

export function FinalCtaSection() {
  return (
    <section
      id="get-started"
      className="section-rule w-full scroll-mt-20 py-24 md:py-32"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 text-center">
        <div className="flex items-center gap-2.5">
          <span className="icon-pill">
            <SiClaude size={16} />
          </span>
          <span className="icon-pill">
            <OpenAIIcon className="size-[16px]" />
          </span>
          <span className="icon-pill">
            <SiGooglegemini size={16} />
          </span>
          <span className="icon-pill">
            <SiCursor size={16} />
          </span>
        </div>

        <h2 className="display-section mt-8 max-w-[22ch] text-foreground">
          Design with every AI you already pay for.
        </h2>
        <p className="mt-4 max-w-[58ch] text-[0.95rem] leading-relaxed text-muted">
          Collaborate with AI on designs, prototypes, slides, one-pagers, and
          more&mdash;free, open source, and built for the subscriptions you
          already pay for.
        </p>

        <div className="mt-9 flex justify-center">
          <DownloadButtonComingSoon />
        </div>

        <p className="mt-5 text-[0.82rem] text-subtle">
          Downloads coming soon &middot; macOS, Windows, and Linux
        </p>
      </div>
    </section>
  );
}
