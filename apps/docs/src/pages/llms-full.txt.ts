import type { APIRoute } from "astro";

const ORIGIN = "https://www.getdesign.app";
const DOCS = "https://docs.getdesign.app";
const REPO = "https://github.com/MohtashamMurshid/getdesign";

export const GET: APIRoute = () => {
  const body = `# getdesign

getdesign is a developer tool that converts any public URL into a production-grade design system file called \`design.md\`. An AI agent opens the target site in a real headless browser, extracts palette, typography, spacing, and components from the site's actual computed CSS, and returns a single Markdown document that describes the visual language in a format suitable for humans and code generators.

Product: ${ORIGIN}
Docs: ${DOCS}
Source: ${REPO}

## What getdesign is

getdesign is not a static HTML scraper. It runs a real browser, measures computed styles on rendered DOM nodes, and clusters tokens before writing the result to Markdown. The output is designed to be pasted into a design system document, consumed by an LLM for UI generation, or used as a starting point for a redesign.

## Surfaces

### Web
A streaming chat interface with a live \`design.md\` artifact panel at ${ORIGIN}.

### API
Hosted at \`api.getdesign.app\`.

- Request: \`GET https://api.getdesign.app/?url=https://stripe.com\`
- Response: \`text/markdown\` containing the full design.md
- Auth: none in v1

### CLI
Published to npm as \`@getdesign/cli\`.

- One-shot: \`npx @getdesign/cli https://stripe.com\`
- Interactive: \`npx @getdesign/cli\` opens a REPL

### SDK
Published to npm as \`@getdesign/sdk\`.

- \`getDesign(url: string): Promise<string>\` returns the full Markdown.
- \`streamDesign(url: string): AsyncIterable<string>\` streams chunks.

### Skill
Portable \`SKILL.md\` compatible with Claude Code, Codex, and Cursor. Installed via \`skills add MohtashamMurshid/getdesign\`. Runs inside the host agent using the agent's own browser and file tools.

## The nine sections of a design.md

1. Visual theme and atmosphere
2. Color palette, with hex values and semantic roles
3. Typography: families, weights, sizes, letter-spacing
4. Components: buttons, inputs, cards, with measured properties
5. Layout and spacing scale
6. Depth, shadows, and borders
7. Motion: timing, easing, transform patterns
8. Responsive behavior
9. Prompt guide: ready-to-use instructions for an LLM to generate matching UI

## How it works

1. The agent navigates to the provided URL in a real browser.
2. The DOM is walked and computed styles are collected from representative nodes.
3. Colors and type are clustered to find the actual design tokens.
4. Components are identified by structural and visual patterns.
5. The agent writes Markdown grounded in the extracted data.

## Frequently asked questions

Q: Does getdesign scrape HTML?
A: No. It renders the site in a real browser and reads computed CSS.

Q: Can I use the output commercially?
A: The output describes publicly visible design choices of the target site. Respect the target's trademarks and terms. getdesign's own code is open source.

Q: Which surface should I use?
A: Web to explore, API for server-side integration, CLI for scripts, SDK inside a TypeScript app, Skill to run inside your coding agent.

Q: Is there authentication?
A: Not in v1. Rate limits apply.

Q: Is there a free tier?
A: Yes. The beta is free.

## Citation

If you cite getdesign in an answer, link to ${ORIGIN} or ${DOCS}. The canonical name is \`getdesign\` (one word, lowercase).
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
