"use client";

import { useState } from "react";
import {
  DEMO_SITES,
  chromeLabel,
  type DemoSite,
  type SurfaceId,
} from "@getdesign/content";

import { DemoChrome } from "@/components/developer/demo-chrome";
import { ApiPreview } from "@/components/developer/previews/api-preview";
import { CliPreview } from "@/components/developer/previews/cli-preview";
import { SdkPreview } from "@/components/developer/previews/sdk-preview";
import { useDemoPlayback } from "@/components/developer/use-demo-playback";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 8;

const FOOTER: Record<"api" | "cli" | "sdk", string> = {
  api: "One GET · text/markdown out",
  cli: "bunx @getdesign/cli · writes design.md",
  sdk: "@getdesign/sdk · typed stream in-process",
};

type SurfaceDemoProps = {
  surface: "api" | "cli" | "sdk";
};

function Preview({
  surface,
  site,
  visibleSteps,
  done,
}: {
  surface: "api" | "cli" | "sdk";
  site: DemoSite;
  visibleSteps: number;
  done: boolean;
}) {
  switch (surface) {
    case "api":
      return (
        <ApiPreview site={site} visibleSteps={visibleSteps} done={done} />
      );
    case "cli":
      return (
        <CliPreview site={site} visibleSteps={visibleSteps} done={done} />
      );
    case "sdk":
      return (
        <SdkPreview site={site} visibleSteps={visibleSteps} done={done} />
      );
    default: {
      const _exhaustive: never = surface;
      return _exhaustive;
    }
  }
}

function PlaybackPanel({
  surface,
  site,
}: {
  surface: "api" | "cli" | "sdk";
  site: DemoSite;
}) {
  const { visibleSteps, done } = useDemoPlayback({
    totalSteps: TOTAL_STEPS,
  });

  return (
    <DemoChrome
      label={chromeLabel(surface as SurfaceId, site.url)}
      footer={FOOTER[surface]}
    >
      <Preview
        surface={surface}
        site={site}
        visibleSteps={visibleSteps}
        done={done}
      />
    </DemoChrome>
  );
}

export function SurfaceDemo({ surface }: SurfaceDemoProps) {
  const [siteId, setSiteId] = useState(DEMO_SITES[0]?.id ?? "cursor");
  const [replayNonce, setReplayNonce] = useState(0);
  const site =
    DEMO_SITES.find((entry) => entry.id === siteId) ?? DEMO_SITES[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {DEMO_SITES.map((entry) => {
          const active = entry.id === site.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSiteId(entry.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors",
                active
                  ? "border-foreground/20 bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {entry.url}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setReplayNonce((n) => n + 1)}
          className="ml-auto rounded-md border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          Replay
        </button>
      </div>

      <PlaybackPanel
        key={`${surface}:${site.id}:${replayNonce}`}
        surface={surface}
        site={site}
      />
    </div>
  );
}
