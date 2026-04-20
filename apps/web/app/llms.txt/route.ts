import { SITE_DOMAIN, SITE_GITHUB_URL, SITE_NAME } from "../_lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} turns any public URL into a production-grade design system. An agent opens the site in a real browser, extracts palette, typography, and components, and returns a ${"`design.md`"} file grounded in the site's actual CSS.

${SITE_NAME} ships five surfaces that share one agent core:

- Web: streaming chat UI with a live design.md artifact panel at ${SITE_DOMAIN}
- API: ${"`GET https://api.getdesign.app/?url=...`"} returns ${"`text/markdown`"}
- CLI: ${"`npx @getdesign/cli <url>`"}, one-shot or interactive REPL, single Bun binary
- SDK: ${"`npm i @getdesign/sdk`"}, typed client exposing ${"`getDesign(url)`"} and ${"`streamDesign(url)`"}
- Skill: portable SKILL.md that runs inside Claude Code, Codex, and Cursor using the host agent's own tools

## Docs

- [Home](${SITE_DOMAIN}): product overview, surfaces, how it works
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
