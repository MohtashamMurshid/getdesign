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

${SITE_NAME} is a developer tool that converts any public URL into a production-grade design system file called ${"`design.md`"}. An AI agent opens the target site in a real headless browser, extracts the palette, typography, spacing, and components from the site's actual computed CSS, and returns a single Markdown document that describes the visual language in a format suitable for humans and code generators.

Site: ${SITE_DOMAIN}
Source: ${SITE_GITHUB_URL}

## What ${SITE_NAME} is

${SITE_NAME} is not a static HTML scraper. It runs a real browser, measures computed styles on rendered DOM nodes, and clusters tokens before writing the result to Markdown. The output is designed to be pasted into a design system document, consumed by an LLM for UI generation, or used as a starting point for a redesign.

## Surfaces

The web, API, CLI, and SDK share the agent core. The Skill runs inside your coding agent using its own tools.

### 1. Web
Sign in at ${SITE_DASHBOARD_URL}, save your Daytona and OpenAI keys in Account, then paste a URL to generate a ${"`design.md`"}. The marketing site at ${SITE_DOMAIN} has an animated sample, not a live extraction.

### 2. API
HTTP endpoint at ${"`api.getdesign.app`"}.

Request: ${"`GET https://api.getdesign.app/v1/design?url=https://stripe.com`"}
Response: ${"`text/markdown`"} containing the full design.md, or JSON with ${"`format=json`"}.
Progress: ${"`GET /v1/design/stream?url=<absolute-url>`"} returns SSE progress events, then a result or error. The Markdown endpoint returns its body after the run finishes.
Auth: ${"`Authorization: Bearer <WorkOS access token>`"}. There is no getdesign API key in V1.
Provider headers: ${"`x-daytona-api-key`"} and ${"`x-openai-api-key`"}. Send credentials over HTTPS, never in query parameters.
Missing or invalid authentication returns 401. Missing provider credentials returns 409 with code credentials_missing. Capture failure returns 409 with code capture_failed. To accept degraded output, retry with ${"`x-getdesign-mode: text_only`"}; OpenAI is still required, but Daytona is optional in that mode.
The older ${"`GET /?url=...`"} Markdown route remains compatible and requires the same authentication and credentials. Only ${"`GET /health`"} is unauthenticated.

### 3. CLI
Runs locally on Bun. Set DAYTONA_API_KEY and OPENAI_API_KEY in your shell. No WorkOS token is needed for local execution.

One-shot: ${"`bunx @getdesign/cli https://stripe.com`"}
Default output: ${"`./getdesign-runs/<slug>/design.md`"}. Use ${"`--out design.md`"} to choose a file. Progress goes to stderr. There is no interactive REPL.

### 4. SDK
TypeScript execution SDK. Runs the agent in-process on your Bun server, not through the hosted API. It is not a browser or edge-runtime client. Node support is not promised for V1.

Install: ${"`bun add @getdesign/sdk`"}
API:
- ${"`getDesign(url, options)`"} returns a structured result; read ${"`result.markdown`"} for Markdown.
- ${"`streamDesign(url, options)`"} yields typed progress, result, or error events. Read ${"`event.result.markdown`"} when ${"`event.type === 'result'`"}; it does not stream Markdown chunks.
- Pass ${"`credentials: { daytonaApiKey, openaiApiKey }`"} in options. Keep keys in server-side environment variables, not browser code. No WorkOS token is needed for local execution.

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
A: ${SITE_AUTH_DESCRIPTION}

Q: What does a run cost?
A: ${SITE_RUN_COST_DESCRIPTION} Costs vary by site and provider usage. getdesign does not supply provider credits.

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
