export type SurfaceId = "web" | "api" | "cli" | "sdk" | "skill";

export type DemoSite = {
  id: string;
  url: string;
  brandColor: string;
  theme: string;
  palette: string[];
  fonts: [string, string];
  sections: string[];
};

export type SurfaceMeta = {
  id: SurfaceId;
  label: string;
  hint: string;
  docsPath: string;
};

export const DOCS_BASE_URL = "https://docs.getdesign.app";
export const SITE_GITHUB_URL =
  "https://github.com/MohtashamMurshid/getdesign";
export const API_BASE_URL = "https://api.getdesign.app";
export const SKILL_INSTALL_CMD = "npx skills add MohtashamMurshid/getdesign";

export const DEMO_SITES: DemoSite[] = [
  {
    id: "cursor",
    url: "cursor.com",
    brandColor: "#ededed",
    theme: "Warm minimalism meets code-editor elegance",
    palette: ["#f2f1ed", "#26251e", "#f54e00", "#cf2d56"],
    fonts: ["CursorGothic Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "components"],
  },
  {
    id: "linear",
    url: "linear.app",
    brandColor: "#5E6AD2",
    theme: "Hyper-precise dark UI with signal-gradient accents",
    palette: ["#0a0a0b", "#e6e6e8", "#5e6ad2", "#ff4d6d"],
    fonts: ["Inter Display", "Berkeley Mono"],
    sections: ["visualTheme", "palette", "typography", "interaction"],
  },
  {
    id: "stripe",
    url: "stripe.com",
    brandColor: "#635BFF",
    theme: "Bright, confident, dense information architecture",
    palette: ["#ffffff", "#0a2540", "#635bff", "#00d4ff"],
    fonts: ["Sohne", "Sohne Mono"],
    sections: ["visualTheme", "palette", "typography", "layout"],
  },
];

export const DEFAULT_DEMO_SITE_ID = "stripe";

export const SURFACE_META: SurfaceMeta[] = [
  { id: "web", label: "web", hint: "getdesign.app", docsPath: "/surfaces/web" },
  {
    id: "api",
    label: "api",
    hint: "api.getdesign.app",
    docsPath: "/surfaces/api",
  },
  {
    id: "cli",
    label: "cli",
    hint: "npx @getdesign/cli",
    docsPath: "/surfaces/cli",
  },
  {
    id: "sdk",
    label: "sdk",
    hint: "@getdesign/sdk",
    docsPath: "/surfaces/sdk",
  },
  {
    id: "skill",
    label: "skill",
    hint: "skills.sh",
    docsPath: "/surfaces/skill",
  },
];

export const CHROME_LABEL_TEMPLATES: Record<SurfaceId, string> = {
  web: "getdesign.app",
  api: "api.getdesign.app/?url={url}",
  cli: "~ · zsh",
  sdk: "app.ts · @getdesign/sdk",
  skill: "claude-code · skill: getdesign",
};

export function docsUrl(path = ""): string {
  if (!path) return DOCS_BASE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${DOCS_BASE_URL}${normalized}`;
}

export function chromeLabel(surface: SurfaceId, siteUrl: string): string {
  const template = CHROME_LABEL_TEMPLATES[surface];
  return template.replace("{url}", siteUrl);
}

export function getDemoSite(id: string): DemoSite {
  const site = DEMO_SITES.find((entry) => entry.id === id);
  if (!site) {
    const fallback = DEMO_SITES[0];
    if (!fallback) {
      throw new Error("DEMO_SITES is empty");
    }
    return fallback;
  }
  return site;
}

/** Absolute HTTPS URL used in copyable examples. */
export function exampleUrl(siteUrl: string): string {
  return siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
}

export function buildApiRequest(siteUrl: string): string {
  const url = exampleUrl(siteUrl);
  return `GET ${API_BASE_URL}/?url=${url}\nAccept: text/markdown`;
}

export function buildCurlExample(siteUrl: string): string {
  const url = exampleUrl(siteUrl);
  const host = siteUrl.replace(/^https?:\/\//, "").split("/")[0] ?? "site";
  const slug = host.replace(/\./g, "-");
  return `curl "${API_BASE_URL}/?url=${url}" \\\n  -H "Accept: text/markdown" \\\n  -o ${slug}.design.md`;
}

export function buildCliCommand(siteUrl: string): string {
  return `bunx @getdesign/cli ${exampleUrl(siteUrl)}`;
}

export function buildSdkInstall(): string {
  return "bun add @getdesign/sdk";
}

export function buildSdkGetDesignSnippet(siteUrl: string): string {
  const url = exampleUrl(siteUrl);
  return `import { getDesign } from "@getdesign/sdk";

const system = await getDesign("${url}", {
  credentials: {
    daytonaApiKey: process.env.DAYTONA_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
});
console.log(system.markdown);`;
}

export function buildSdkStreamSnippet(siteUrl: string): string {
  const url = exampleUrl(siteUrl);
  return `import { streamDesign } from "@getdesign/sdk";

for await (const event of streamDesign("${url}", {
  credentials: {
    daytonaApiKey: process.env.DAYTONA_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
})) {
  if (event.type === "progress") console.log(event.event);
  if (event.type === "result") console.log(event.result.markdown);
}`;
}

/** Compact stream snippet for animated demos (matches marketing surface). */
export function buildSdkDemoSnippet(siteUrl: string): string {
  return `import { streamDesign } from "@getdesign/sdk";

const stream = streamDesign("${siteUrl}");

for await (const chunk of stream) {
  process.stdout.write(chunk);
}`;
}
