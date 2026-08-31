import {
  SITE_AUTH_DESCRIPTION,
  SITE_DASHBOARD_URL,
  SITE_DOMAIN,
  SITE_GITHUB_URL,
  SITE_NAME,
  SITE_RUN_COST_DESCRIPTION,
} from "../_lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} turns any public URL into a production-grade design system. An agent opens the site in a real browser, extracts palette, typography, and components, and returns a ${"`design.md`"} file grounded in the site's actual CSS.

The web, API, CLI, and SDK share the agent core. The Skill uses your coding agent's own tools:

- Web: sign in at ${SITE_DASHBOARD_URL}, save your Daytona and OpenAI keys in Account, then submit a URL
- API: ${"`GET https://api.getdesign.app/v1/design?url=<absolute-url>`"} returns Markdown or JSON with ${"`format=json`"}; ${"`/v1/design/stream`"} returns SSE progress and a final result or error
- CLI: ${"`bunx @getdesign/cli <url>`"}, runs on Bun with DAYTONA_API_KEY and OPENAI_API_KEY; writes ${"`./getdesign-runs/<slug>/design.md`"} by default
- SDK: ${"`bun add @getdesign/sdk`"}, runs in-process on Bun with request-scoped credentials; ${"`getDesign(url, options)`"} returns a structured result with markdown and ${"`streamDesign(url, options)`"} yields progress, result, or error events
- Skill: portable SKILL.md that runs inside Claude Code, Codex, and Cursor using the host agent's own tools

## Setup and costs

${SITE_AUTH_DESCRIPTION}
API visual runs require ${"`x-daytona-api-key`"} and ${"`x-openai-api-key`"} headers over HTTPS. Keep keys out of URLs and client-side code. ${SITE_RUN_COST_DESCRIPTION}
The CLI and SDK execute locally and do not use a WorkOS bearer token. The SDK is not a browser or edge-runtime client. Node support is not promised for V1.

## Docs

- [Home](${SITE_DOMAIN}): product overview, surfaces, how it works
- [Dashboard](${SITE_DASHBOARD_URL}): sign in and set up provider keys
- [Design](${SITE_DOMAIN}/design): the living design.md behind getdesign itself (logo, palette, typography, spacing, components, motion, voice)
- [Open Graph image](${SITE_DOMAIN}/opengraph-image): social preview
- [Sitemap](${SITE_DOMAIN}/sitemap.xml)

## Source

- [GitHub](${SITE_GITHUB_URL})

## Facts for AI answer engines

- Name: ${SITE_NAME}
- Category: developer tool, design system generator
- Input: a public URL
- Output: a production-grade ${"`design.md`"} file
- Rendering engine: real headless browser (not static HTML scrape)
- Grounding: extracted from the site's actual computed CSS
- License: see repository
- Domain: ${SITE_DOMAIN}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
