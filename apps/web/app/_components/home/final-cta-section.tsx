import {
  SITE_APP_CTA_BADGE,
  SITE_APP_CTA_DESCRIPTION,
  SITE_APP_CTA_LABEL,
  SITE_DASHBOARD_URL,
} from "../../_lib/site";
import { SkillInstallCommand } from "../skill-install-command";

export function FinalCtaSection() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-100)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        {SITE_APP_CTA_BADGE}
      </div>

      <h2 className="display-md mt-6">
        Your next design system is one URL away.
      </h2>

      <p className="mt-3 text-[14px] text-muted">
        {SITE_APP_CTA_DESCRIPTION}
      </p>

      <div className="mt-8 flex flex-col items-center">
        <a
          href={SITE_DASHBOARD_URL}
          className="btn-accent inline-flex h-10 items-center gap-2 rounded-md px-5 text-[13px] font-medium transition-transform hover:-translate-y-[1px]"
        >
          {SITE_APP_CTA_LABEL}
          <ArrowIcon />
        </a>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--subtle)]">
          or try the skill today
        </span>
        <SkillInstallCommand compact />
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h8M9 4l4 4-4 4" />
    </svg>
  );
}
