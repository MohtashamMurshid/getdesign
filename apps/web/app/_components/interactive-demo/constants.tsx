import {
  SiCursor,
  SiLinear,
  SiStripe,
} from "@icons-pack/react-simple-icons";

import type { Site, Step, Surface } from "./types";

export const SITES: Site[] = [
  {
    id: "cursor",
    url: "cursor.com",
    favicon: <SiCursor className="h-full w-full" />,
    brandColor: "#ededed",
    theme: "Warm minimalism meets code-editor elegance",
    palette: ["#f2f1ed", "#26251e", "#f54e00", "#cf2d56"],
    fonts: ["CursorGothic Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "components"],
  },
  {
    id: "linear",
    url: "linear.app",
    favicon: <SiLinear className="h-full w-full" />,
    brandColor: "#5E6AD2",
    theme: "Hyper-precise dark UI with signal-gradient accents",
    palette: ["#0a0a0b", "#e6e6e8", "#5e6ad2", "#ff4d6d"],
    fonts: ["Inter Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "interaction"],
  },
  {
    id: "stripe",
    url: "stripe.com",
    favicon: <SiStripe className="h-full w-full" />,
    brandColor: "#635BFF",
    theme: "Bright, confident, dense information architecture",
    palette: ["#ffffff", "#0a2540", "#635bff", "#00d4ff"],
    fonts: ["Sohne", "Sohne Mono"],
    sections: ["visualTheme", "palette", "typography", "layout"],
  },
];

export const SURFACES: Array<{ id: Surface; label: string; hint: string }> = [
  { id: "web", label: "web", hint: "getdesign.app" },
  { id: "api", label: "api", hint: "api.getdesign.app" },
  { id: "cli", label: "cli", hint: "npx @getdesign/cli" },
  { id: "sdk", label: "sdk", hint: "@getdesign/sdk" },
  { id: "skill", label: "skill", hint: "skills.sh" },
];

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
  web: "getdesign.app",
  api: "api.getdesign.app/?url={url}",
  cli: "~ — zsh",
  sdk: "app.ts — @getdesign/sdk",
  skill: "claude-code · skill: getdesign",
};
