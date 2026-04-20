import type { APIRoute } from "astro";

const ORIGIN = "https://www.getdesign.app";
const DOCS = "https://docs.getdesign.app";

export const GET: APIRoute = () => {
  const body = `# getdesign docs

> Documentation for getdesign: the design system for any URL. Paste a URL; an agent opens it in a real browser, extracts palette, typography, and components, and returns a production-grade \`design.md\`.

## Canonical URLs

- Product: ${ORIGIN}
- Docs: ${DOCS}
- Repo: https://github.com/MohtashamMurshid/getdesign

## Surfaces

- Web: streaming chat UI at ${ORIGIN}
- API: \`GET https://api.getdesign.app/?url=...\` returns \`text/markdown\`
- CLI: \`npx @getdesign/cli <url>\`
- SDK: \`npm i @getdesign/sdk\`, \`getDesign(url)\` and \`streamDesign(url)\`
- Skill: \`skills add MohtashamMurshid/getdesign\`, runs inside Claude Code, Codex, Cursor

## Docs

- [Quickstart](${DOCS}/quickstart)
- [Concepts](${DOCS}/concepts)
- [Web surface](${DOCS}/surfaces/web)
- [API surface](${DOCS}/surfaces/api)
- [CLI surface](${DOCS}/surfaces/cli)
- [SDK surface](${DOCS}/surfaces/sdk)
- [Skill surface](${DOCS}/surfaces/skill)
- [SDK reference](${DOCS}/reference/sdk)
- [CLI reference](${DOCS}/reference/cli)
- [FAQ](${DOCS}/resources/faq)
- [Changelog](${DOCS}/resources/changelog)

## Full corpus

- [${DOCS}/llms-full.txt](${DOCS}/llms-full.txt)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
