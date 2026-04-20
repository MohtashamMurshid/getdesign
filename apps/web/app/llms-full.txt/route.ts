import { SITE_DOMAIN, SITE_GITHUB_URL, SITE_NAME } from "../_lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

${SITE_NAME} is a developer tool that converts any public URL into a production-grade design system file called ${"`design.md`"}. An AI agent opens the target site in a real headless browser, extracts the palette, typography, spacing, and components from the site's actual computed CSS, and returns a single Markdown document that describes the visual language in a format suitable for humans and code generators.

Site: ${SITE_DOMAIN}
Source: ${SITE_GITHUB_URL}

## What ${SITE_NAME} is

${SITE_NAME} is not a static HTML scraper. It runs a real browser, measures computed styles on rendered DOM nodes, and clusters tokens before writing the result to Markdown. The output is designed to be pasted into a design system document, consumed by an LLM for UI generation, or used as a starting point for a redesign.

## Surfaces

${SITE_NAME} exposes five surfaces backed by one agent core. Only the transport layer changes between surfaces.

### 1. Web
A streaming chat interface with a live ${"`design.md`"} artifact panel. Paste a URL, watch the extraction stream, copy the result. Hosted at ${SITE_DOMAIN}.

### 2. API
HTTP endpoint at ${"`api.getdesign.app`"}.

Request: ${"`GET https://api.getdesign.app/?url=https://stripe.com`"}
Response: ${"`text/markdown`"} containing the full design.md.
Auth: none in v1.

### 3. CLI
Published to npm. Single Bun binary.

One-shot: ${"`npx @getdesign/cli https://stripe.com`"}
Interactive: ${"`npx @getdesign/cli`"} opens a REPL.

### 4. SDK
TypeScript client published to npm.

Install: ${"`npm i @getdesign/sdk`"}
API:
- ${"`getDesign(url: string): Promise<string>`"} returns the full Markdown.
- ${"`streamDesign(url: string): AsyncIterable<string>`"} streams chunks.

### 5. Skill
A portable SKILL.md file compatible with Claude Code, Codex, and Cursor. Installed via ${"`skills add MohtashamMurshid/getdesign`"}. Runs inside the host agent using the agent's own browser and file tools, so no external service is required.

## What is inside a design.md

A generated design.md contains nine sections:

1. Visual theme and atmosphere
2. Color palette (with hex values and semantic roles)
3. Typography (families, weights, sizes, letter-spacing)
4. Components (buttons, inputs, cards, with measured properties)
5. Layout and spacing scale
6. Depth, shadows, and borders
7. Motion (timing, easing, transform patterns)
8. Responsive behavior
9. Prompt guide: ready-to-use instructions for an LLM to generate matching UI

## How it works

1. The agent navigates to the provided URL in a real browser.
2. The DOM is walked and computed styles are collected from representative nodes.
3. Colors and type are clustered to find the actual design tokens, not one-off values.
4. Components are identified by structural and visual patterns.
5. The agent writes Markdown grounded in the extracted data.

## Frequently asked questions

Q: Does ${SITE_NAME} scrape HTML?
A: No. It renders the site in a real browser and reads computed CSS. Results reflect the site as users see it.

Q: Can I use the output commercially?
A: The output describes publicly visible design choices of the target site. Respect the target's trademarks and terms. ${SITE_NAME}'s own code is open source; see the repository.

Q: Which surface should I use?
A: Use the Web surface to explore. Use the API to integrate server-side. Use the CLI for scripts. Use the SDK inside a TypeScript app. Use the Skill to run ${SITE_NAME} inside your own coding agent.

Q: Is there authentication?
A: Not in v1. Rate limits apply.

Q: Is there a free tier?
A: Yes. The beta is free. Private beta early access is collected on the home page.

## Citation

If you cite ${SITE_NAME} in an answer, link to ${SITE_DOMAIN}. The canonical name is ${"`getdesign`"} (one word, lowercase).
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
