import type { RefObject } from "react";

import type { Site, Surface } from "./types";
import { ApiSurface } from "./surfaces/api-surface";
import { CliSurface } from "./surfaces/cli-surface";
import { SdkSurface } from "./surfaces/sdk-surface";
import { SkillSurface } from "./surfaces/skill-surface";
import { WebSurface } from "./surfaces/web-surface";

type PreviewPanelProps = {
  site: Site;
  surface: Surface;
  visibleSteps: number;
  totalSteps: number;
  done: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
};

export function PreviewPanel({
  site,
  surface,
  visibleSteps,
  totalSteps,
  done,
  scrollRef,
}: PreviewPanelProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              done ? "bg-[var(--accent)]" : "bg-[var(--accent)] pulse-dot"
            }`}
          />
          <span className="text-muted">{done ? "ready" : "extracting"}</span>
          <span className="text-[var(--subtle)]">·</span>
          <span className="font-mono text-[var(--subtle)]">{site.url}</span>
        </div>
        <span className="text-[11px] text-[var(--subtle)]">design.md</span>
      </div>

      <div
        ref={scrollRef}
        className="code-scroll min-h-0 flex-1 overflow-y-auto"
      >
        {surface === "web" ? (
          <WebSurface site={site} visibleSteps={visibleSteps} done={done} />
        ) : null}
        {surface === "api" ? (
          <ApiSurface site={site} visibleSteps={visibleSteps} done={done} />
        ) : null}
        {surface === "cli" ? (
          <CliSurface site={site} visibleSteps={visibleSteps} done={done} />
        ) : null}
        {surface === "sdk" ? (
          <SdkSurface site={site} visibleSteps={visibleSteps} done={done} />
        ) : null}
        {surface === "skill" ? (
          <SkillSurface site={site} visibleSteps={visibleSteps} done={done} />
        ) : null}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-[12.5px]">
          <span className="text-[var(--accent)]">
            {surface === "web"
              ? "›"
              : surface === "cli" || surface === "skill"
                ? "$"
                : "•"}
          </span>
          <span className="text-[var(--subtle)]">
            {surface === "web" && `ask a follow-up about ${site.url}…`}
            {surface === "api" && `curl api.getdesign.app/?url=${site.url}`}
            {surface === "cli" && `npx @getdesign/cli ${site.url}`}
            {surface === "sdk" && `streamDesign("${site.url}")`}
            {surface === "skill" &&
              "npx skills add MohtashamMurshid/getdesign"}
          </span>
          <span className="ml-auto font-mono text-[10.5px] text-[var(--subtle)]">
            {visibleSteps}/{totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}
