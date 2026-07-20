import type { ReactNode } from "react";
import {
  SiCursor,
  SiLinear,
  SiStripe,
} from "@icons-pack/react-simple-icons";
import {
  CHROME_LABEL_TEMPLATES,
  DEMO_SITES,
  SURFACE_META,
  type DemoSite,
} from "@getdesign/content";

import type { Site, Step, Surface } from "./types";

const FAVICONS: Record<string, ReactNode> = {
  cursor: <SiCursor className="h-full w-full" />,
  linear: <SiLinear className="h-full w-full" />,
  stripe: <SiStripe className="h-full w-full" />,
};

function toSite(demo: DemoSite): Site {
  return {
    ...demo,
    fonts: demo.fonts,
    favicon: FAVICONS[demo.id] ?? null,
  };
}

export const SITES: Site[] = DEMO_SITES.map(toSite);

export const SURFACES: Array<{ id: Surface; label: string; hint: string }> =
  SURFACE_META.map(({ id, label, hint }) => ({ id, label, hint }));

export function buildSteps(site: Site): Step[] {
  return [
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.crawl</span>
          <span className="tok-punc">({"{ "}</span>
          <span className="tok-key">url</span>
          <span className="tok-punc">: </span>
          <span className="tok-str">&quot;{site.url}&quot;</span>
          <span className="tok-punc">{" }"})</span>
        </>
      ),
    },
    {
      kind: "ok",
      label: (
        <>
          fetched html + 4 stylesheets · <span className="tok-num">128ms</span>
        </>
      ),
    },
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.screenshot</span>
          <span className="tok-punc">({"{ "}</span>
          <span className="tok-key">viewport</span>
          <span className="tok-punc">: </span>
          <span className="tok-str">&quot;1440x900&quot;</span>
          <span className="tok-punc">{" }"})</span>
        </>
      ),
    },
    {
      kind: "info",
      label: (
        <>
          chromium · daytona sandbox · hero.png{" "}
          <span className="tok-com">1.2MB</span>
        </>
      ),
    },
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.extract</span>
          <span className="tok-punc">({"{ "}</span>
          <span className="tok-key">tokens</span>
          <span className="tok-punc">: </span>
          <span className="tok-str">&quot;all&quot;</span>
          <span className="tok-punc">{" }"})</span>
        </>
      ),
    },
    {
      kind: "ok",
      label: (
        <>
          14 tokens · <span className="tok-num">4</span> palette ·{" "}
          <span className="tok-num">2</span> fonts ·{" "}
          <span className="tok-num">6</span> radii
        </>
      ),
    },
    {
      kind: "call",
      label: (
        <>
          <span className="tok-fn">getdesign.synthesize</span>
          <span className="tok-punc">()</span>
        </>
      ),
    },
    {
      kind: "ok",
      label: (
        <>
          wrote <span className="tok-str">design.md</span> ·{" "}
          <span className="tok-num">9</span> sections ·{" "}
          <span className="tok-num">14.3KB</span>
        </>
      ),
    },
  ];
}

export const CHROME_LABELS: Record<Surface, string> = {
  ...CHROME_LABEL_TEMPLATES,
};
