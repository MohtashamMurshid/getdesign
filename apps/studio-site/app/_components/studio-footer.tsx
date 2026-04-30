import {
  SITE_COPYRIGHT,
  SITE_GETDESIGN_URL,
  SITE_GITHUB_URL,
  SITE_RELEASES_URL,
} from "../_lib/site";
import { StudioMark } from "./studio-mark";
import { SITE_NAME } from "../_lib/site";

export function StudioFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-[0.85rem] text-muted">
          <StudioMark size={18} />
          <span>
            {SITE_COPYRIGHT} &middot; {SITE_NAME} is open source under MIT
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.85rem]">
          <a
            href={SITE_GETDESIGN_URL}
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            getdesign.app
          </a>
          <a
            href={SITE_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            GitHub
          </a>
          <a
            href={SITE_RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            Releases
          </a>
        </nav>
      </div>
    </footer>
  );
}
