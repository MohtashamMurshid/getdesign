import { SITE_RELEASES_URL } from "../_lib/site";
import { DownloadIcon } from "./icons";

type DownloadButtonComingSoonProps = {
  /** For hero `#download` anchor targets */
  id?: string;
  className?: string;
  variant?: "default" | "sm";
};

/**
 * Full download affordance with a “Coming soon” pill. Link still points at
 * GitHub Releases so interested visitors can watch the repo.
 */
export function DownloadButtonComingSoon({
  id,
  className = "",
  variant = "default",
}: DownloadButtonComingSoonProps) {
  const sm = variant === "sm";
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <a
        id={id}
        href={SITE_RELEASES_URL}
        target="_blank"
        rel="noreferrer"
        className={`btn btn-primary ${sm ? "btn-sm" : ""} gap-1.5 pr-3`}
        aria-label="Download — coming soon"
      >
        Download
        <DownloadIcon />
      </a>
      <span
        className={`absolute z-10 whitespace-nowrap rounded-full border border-border-strong bg-surface px-2 py-0.5 font-medium text-foreground shadow-sm ${
          sm
            ? "-right-0.5 -top-2 text-[0.58rem] leading-tight"
            : "-right-1 -top-2.5 text-[0.65rem] leading-none"
        } `}
      >
        Coming soon
      </span>
    </span>
  );
}
