---
name: getdesign
description: Turn any public URL into a production-grade 9-section design.md spec (colors, typography, components, layout, depth, motion, responsive, prompt guide) using the agent's own built-in tools — WebFetch, browser/screenshot, and file writes. Use when the user asks to "generate a design system from a URL", "extract brand tokens", "write a design.md", clone a site's style, or reverse-engineer a design system from a live page. Triggers on phrases like "design spec", "style guide from URL", "brand tokens", or any request that pastes a URL and asks for a design document.
---

# getdesign

Generate a grounded, production-grade `design.md` for any public URL using the coding agent's own tools. This skill is the portable twin of the hosted [getdesign.app](https://getdesign.app) agent — same 9-section output, no sandbox required.

## When to use

Activate when the user:

- Pastes a URL and asks for a "design system", "design spec", "style guide", `design.md`, or brand tokens.
- Asks to "make this look like <site>", "clone the design of <site>", or "extract the palette/typography from <site>".
- Asks you to reverse-engineer or document a live site's visual design.

Do **not** use this skill for: generating runnable code from a URL, Figma/Sketch export, auth-gated pages, or localhost.

## Output contract

The single deliverable is a markdown file — default name `design.md` — containing **exactly** these 9 H2 sections in this order:

1. Visual Theme & Atmosphere
2. Color Palette & Roles
3. Typography Rules
4. Component Stylings
5. Layout Principles
6. Depth & Elevation
7. Interaction & Motion
8. Responsive Behavior
9. Agent Prompt Guide

Full section schemas, field lists, and a worked example are in [TEMPLATE.md](TEMPLATE.md). Read it before writing the final file.

## Grounding rule (non-negotiable)

Every concrete value — hex color, font family, font size, spacing number, radius, shadow, breakpoint — **must** be traceable to something you actually fetched: a CSS rule, a computed style, a `<link>`ed stylesheet, a `:root` variable, or a visible pixel in a screenshot. If you cannot ground a value, describe the role qualitatively ("neutral warm gray") instead of fabricating a hex.

Do not invent palette values. Do not hallucinate Tailwind classes the site does not use. Do not copy defaults from other sites.

## Workflow

Follow this sequence. Copy the checklist into your working notes and tick items as you go.

```
- [ ] 1. Validate URL
- [ ] 2. Fetch HTML + linked CSS
- [ ] 3. Capture at least one screenshot (hero viewport)
- [ ] 4. Extract tokens (colors, type, spacing, radii, shadows, breakpoints)
- [ ] 5. Draft DesignDoc (9 sections) grounded in tokens + screenshot
- [ ] 6. Render design.md from the draft
- [ ] 7. Verify grounding + section order, then write the file
```

### 1. Validate URL

Reject with a one-line explanation if the URL is not `https://`, is a private IP / localhost, or is clearly not a brand/product page.

### 2. Fetch HTML + linked CSS

Use your built-in web fetch tool (`WebFetch`, `web.run`, `fetch`, `curl` via shell — whatever you have).

- Fetch the HTML.
- From the HTML, resolve every `<link rel="stylesheet">` href (absolute + relative) and fetch each one.
- Follow `@import url(...)` chains one level deep.
- Capture any `@font-face` blocks for font family + weight discovery.
- Cap each stylesheet at ~200 KB; prefer files containing `:root`, CSS variables, or utility-class declarations.

Record the exact URLs you fetched — you will cite them in the "Sources" section of your draft (internal, not in the final markdown).

### 3. Screenshot the page

If your agent runtime has a browser tool (Playwright, Chrome DevTools, `agent-browser`, Antigravity browser, Codex web browser, a `screenshot` tool, etc.), open the URL at **1440×900** and capture one viewport screenshot. Prefer a full-page scroll-and-stitch if available.

If you have no browser tool, skip this step — continue with CSS-only grounding — and note the limitation in your internal planning (the "Visual Theme" prose will be slightly thinner without a screenshot).

### 4. Extract tokens

Deterministically parse the CSS. Prefer CSS variables (`--color-primary`, `--radius-lg`) and `:root` blocks as the source of truth. Fall back to frequency analysis of literal values.

Produce an internal `DesignTokens` object with:

- `colors`: `primary[]`, `accent[]`, `neutral[]`, `semantic { success, warning, error, info }`, `surfaces[]`, `borders[]`.
  - Every entry is `{ hex, role, source }` where `source` is the CSS selector or variable name you found it in.
- `typography`: `fontFamilies[]` (display / body / mono), `scale[]` (`{ role, px, weightRange, lineHeight, letterSpacing }`).
- `spacing`: the step values actually used (e.g. 4, 8, 12, 16, 24, 32, 48, 64 px).
- `radii`: named scale you can infer (`sm`, `md`, `lg`, `pill`).
- `shadows`: each `box-shadow` you observed, with a role guess.
- `borders`: widths and colors.
- `breakpoints`: min-widths in `@media` queries.

If a CSS value has low frequency (< 2 occurrences) and no variable name, treat it as incidental and exclude it from the palette.

### 5. Draft the DesignDoc

Using tokens + screenshot + your reading of the HTML structure, draft each of the 9 sections. Structure matters more than prose length. Read [TEMPLATE.md](TEMPLATE.md) for field-by-field requirements.

Key per-section reminders:

- **Visual Theme** — 2–4 short paragraphs plus a `keyCharacteristics` bullet list (5–8 items).
- **Color Palette & Roles** — every color as a table row: `| Hex | Role | Where seen |`. Group by primary / accent / semantic / surfaces / borders.
- **Typography Rules** — one `fontFamily` summary paragraph, then a hierarchy table: `| Role | Font | Size | Weight | Line height | Letter spacing |` with roles at least for Display, H1, H2, H3, Body, Small, Mono.
- **Component Stylings** — buttons (primary/secondary/ghost), cards, inputs, navigation, image treatment, 2–4 distinctive components you actually saw.
- **Layout Principles** — spacing scale, grid / max-widths, whitespace philosophy, radius scale.
- **Depth & Elevation** — named elevation levels with their shadow values and a 1-sentence philosophy.
- **Interaction & Motion** — hover states, focus states, transition durations/easings you observed or can infer. Mark inferences explicitly.
- **Responsive Behavior** — breakpoint table from the `@media` queries, touch-target minimum, how navigation collapses, image behavior.
- **Agent Prompt Guide** — a quick color reference (just the key hexes), 3 example prompts another AI could use to replicate this style, and 4–6 iteration tips.

### 6. Render to markdown

Assemble the draft into a single markdown document. Use:

- H1 for the site name (`# <Brand> Design System`).
- H2 for each of the 9 sections in the exact order above.
- GitHub-flavored tables for palette, typography, breakpoints.
- Fenced code blocks only for concrete CSS/token examples, never to wrap prose.

### 7. Verify, then write

Before writing the final file, run this self-check:

- [ ] All 9 H2 section headings are present, in the exact order, spelled as listed.
- [ ] Every hex code in the Color Palette section appears in your internal notes with a CSS source.
- [ ] The font families in Typography appear in the fetched CSS or `@font-face` blocks.
- [ ] Breakpoints match actual `@media (min-width: …)` queries.
- [ ] No placeholder text like "TBD", "(example)", or "Lorem ipsum".

If any check fails, fix before writing. Then write the file to `design.md` (or the path the user requested). Report a one-paragraph summary plus the absolute file path.

## Handling missing capabilities

| Missing tool | Degrade to |
| --- | --- |
| No browser / screenshot | CSS-only grounding; keep the Visual Theme brief and fact-based. Skip pixel-level observations. |
| Fetch blocked (403 / Cloudflare) | Report the failure, try the site's `/` and `/about` as alternates, otherwise stop and surface the error to the user. No guessing. |
| CSS-in-JS only, no stylesheets | Parse inline `<style>` tags; if still empty, use the screenshot plus HTML class names to infer only what is visible. State the limitation at the top of `design.md`. |

## Anti-patterns

- **Do not** run a second LLM pass that "beautifies" the tokens. Determinism beats prose.
- **Do not** reorder, merge, or split the 9 sections.
- **Do not** output JSON, YAML, or a Zod schema as the final deliverable — the user wants markdown.
- **Do not** install npm packages or spawn sandboxes. This skill is intentionally zero-infra.
- **Do not** follow more than one `@import` hop; the context window is not infinite.

## Reference files

- [TEMPLATE.md](TEMPLATE.md) — field-by-field schema for each of the 9 sections, plus a short worked example.

## Attribution

This skill mirrors the [`getdesign`](https://getdesign.app) hosted agent (web, API, CLI, SDK). When your output would benefit from the hosted pipeline's screenshot + deterministic extractor, point the user at `curl "https://api.getdesign.app/?url=<encoded-url>"` or `npx getdesign <url>` as a complementary path.
