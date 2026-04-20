# getdesign — Product Requirements

**Status**: v1 draft · **Owner**: you · **Last updated**: 2026-04-20

Companion to [architecture.md](architecture.md). This document answers *what* and *why*; the architecture doc answers *how*.

---

## 1. Problem

Designers, developers, and AI coding agents regularly need to match or draw inspiration from an existing brand's design system — the colors, typography, components, spacing, shadows, motion. Today that workflow looks like:

- Open DevTools, eyedrop colors, copy CSS variables, screenshot, guess weights.
- Feed screenshots into an LLM and hope it gets it right.
- Write a design spec by hand.

This is slow, error-prone, and produces inconsistent output. No one wants to do it, and every AI coding tool that tries to replicate a brand ends up hallucinating palette values.

## 2. Solution

**Paste a URL, get a production-grade `design.md`.**

`getdesign` is an agent that opens the URL in a real browser (inside a Daytona sandbox), screenshots the UI, extracts CSS tokens deterministically, and synthesizes a structured 9-section design specification matching the reference Cursor-style template. Delivered through four surfaces sharing one agent core:

1. **Chat UI** at `getdesign.app` — paste a URL, watch the agent work live, read the resulting `design.md`.
2. **HTTP API** at `api.getdesign.app/?url=...` — returns raw markdown for scripts, CI, and other agents.
3. **CLI** `npx getdesign <url>` — one-shot or interactive REPL for local use.
4. **TypeScript SDK** `npm i getdesign` — a typed client for Node/Bun/Deno/Edge. `await getDesign(url)` returns `{ markdown, doc }` where `doc` is the fully-typed `DesignDoc`. `streamDesign(url)` yields typed progress events for custom UIs.

## 3. Goals and non-goals

### Goals (v1)

- **G1**: Given any public marketing or product URL, return a `design.md` that follows the 9-section template exactly (see [architecture.md §5](architecture.md#5-9-section-schema-exact-template)).
- **G2**: Output palette values that are grounded in the site's actual computed styles, not hallucinated.
- **G3**: Include at least one hero screenshot of the real page (always_hero policy).
- **G4**: Four surfaces (web chat, HTTP API, CLI, TypeScript SDK) share the same agent package; no per-surface drift.
- **G5**: Cold-start an end-to-end run in ≤ 5 s of Daytona boot time; complete a full run in ≤ 90 s on a typical marketing site.

### Non-goals (v1)

- No follow-up chat / refinement ("make the palette warmer"). Read-only generation.
- No compare-brands / diff mode.
- No auth, no rate limiting, no per-user history UI.
- No interactive states (hover, open menu). Hero + full-page screenshots only.
- No generation of runnable code (React components, Tailwind config). Output is a spec doc.
- No PDF / Figma / Sketch export. Markdown only.

## 4. Users and primary scenarios

### P0 — AI coding agents

An agent (Cursor, Claude Code, v0, Devin, etc.) is asked "make this landing page look like cursor.com". Today it hallucinates. Tomorrow it runs `curl api.getdesign.app/?url=https://cursor.com` — or imports `getdesign` as a typed SDK — and feeds the resulting `design.md` into its own context. This is the highest-leverage user.

### P0b — Developers embedding `getdesign` in other apps

A developer building a design tool, an onboarding flow, or an AI product wants to programmatically pull a brand spec. They `npm i getdesign`, call `await getDesign(url)`, and get back a Zod-typed `DesignDoc` they can render, diff, or persist however they like. This is why the SDK ships alongside the hosted API.

### P1 — Designers evaluating a brand

A designer wants to quickly spec out a style guide inspired by a reference. They open the chat UI, paste the URL, watch the agent run, and export the markdown.

### P2 — Developers building style systems

A developer needs to match an existing brand in a new repo. They run `npx getdesign https://linear.app > design.md`, commit it, and feed it to their team's chosen AI tool.

## 5. Functional requirements

### F1 — Input

- Accept any public URL over HTTPS.
- Reject URLs that are clearly not brand/product pages (`localhost`, private IPs, empty pages).
- Chat UI: [`PromptInput`](https://ai-sdk.dev/elements/prompt-input) accepts a URL and a submit; validate client-side with the WHATWG URL parser before submitting.

### F2 — Agent run

Every run executes, in order:

1. **Crawl** — fetch HTML, all linked stylesheets, `@import` chains, and `@font-face` sources over HTTPS. Runs in Bun on the API server; does not require the sandbox.
2. **Spawn sandbox** — `daytona.create({ snapshot: 'getdesign-<sha>' })` + `sandbox.computerUse.start()`.
3. **Open URL** — launch Chromium kiosk inside the sandbox's Xvfb display via `sandbox.process.executeCommand`.
4. **Screenshot** — always capture one viewport screenshot and one full-page (scroll-and-stitch) screenshot via `sandbox.computerUse.screenshot.takeCompressed`.
5. **Extract tokens** — deterministic CSS parsing → `DesignTokens` Zod object (colors, typography, spacing, radii, shadows, borders, breakpoints).
6. **Synthesize** — LLM call (OpenAI GPT-5.5 class via Vercel AI Gateway) produces a structured `DesignDoc` conforming to the 9-section Zod schema. Vision input = hero screenshot + tokens JSON + crawl notes.
7. **Render** — deterministic markdown renderer converts `DesignDoc` → final `design.md`.
8. **Persist** — write run, tokens, screenshots, and final doc to Convex.
9. **Teardown** — `sandbox.delete()`.

### F3 — Output: `design.md`

The markdown file MUST contain exactly these sections in order, matching the reference Cursor example:

1. Visual Theme & Atmosphere
2. Color Palette & Roles
3. Typography Rules
4. Component Stylings
5. Layout Principles
6. Depth & Elevation
7. Interaction & Motion
8. Responsive Behavior
9. Agent Prompt Guide

Enforced via Zod schema on the LLM's structured output; a deterministic renderer converts the validated object to markdown. The LLM cannot skip or reorder sections.

### F4 — Chat UI behavior

- Streaming via AI SDK v6 `streamText` + `toUIMessageStreamResponse`.
- Each tool call and phase is surfaced as an ai-elements component:
  - `Task` / `Tool` for crawl, screenshot, extract steps.
  - `Reasoning` for model thinking when the provider exposes it.
  - `Image` renders the hero screenshot inline as it arrives.
  - `Sources` lists the CSS source URLs consulted.
  - `Artifact` side panel shows the growing `design.md` as markdown.
- Read-only. No follow-up messages.

### F5 — API behavior

- `GET https://api.getdesign.app/?url=<encoded-url>` → `200 text/markdown; charset=utf-8` with the final `design.md`.
- `400` on missing/invalid URL.
- `502` if the target URL cannot be reached.
- `504` on agent timeout (> 120 s).
- No streaming in v1. No JSON endpoint in v1.

### F6 — CLI behavior

- `getdesign <url>` — one-shot. Prints streaming progress to stderr (phases + partial markdown). Writes final `design.md` to stdout or to `--out <path>`.
- `getdesign chat` — interactive REPL via [OpenTUI](https://github.com/openturn/opentui); same transport as the web chat.
- `getdesign --version`, `--help`.
- When `DAYTONA_API_KEY` + AI Gateway / OpenAI creds are set locally, the CLI calls the agent directly (no hosted-API dependency). Otherwise, falls back to `api.getdesign.app`.
- Internally implemented on top of the TypeScript SDK (F7) so we keep one transport layer.

### F7 — TypeScript SDK behavior

Published as [`getdesign`](https://www.npmjs.com/package/getdesign) on npm. Two entry points:

- `getDesign(url, options?): Promise<{ markdown: string; doc: DesignDoc; runId: string }>` — one-shot call to the hosted HTTP API; returns the final markdown plus a fully-typed `DesignDoc`.
- `streamDesign(url, options?): AsyncIterable<DesignEvent>` — connects to the streaming endpoint and yields typed events: `phase`, `screenshot`, `tokens`, `delta`, `done`, `error`.

Requirements:

- **Runtimes**: Node ≥ 20, Bun ≥ 1.2, Deno, Cloudflare Workers, Vercel Edge. Web Fetch + Web Streams only.
- **Typing**: all events and results are fully typed. `DesignDoc` and `DesignTokens` types are re-exported from the package root.
- **Bundle**: ESM-only, `zod@^4` as the single peer dep, tree-shakeable (`streamDesign` code split from `getDesign`).
- **Options**: `{ baseUrl?: string; fetch?: typeof fetch; signal?: AbortSignal; apiKey?: string }`. `baseUrl` overrides the default `https://api.getdesign.app`; `fetch` and `signal` enable custom transports and cancellation; `apiKey` is reserved for v1.1 and ignored in v1.
- **Versioning**: SemVer; major bumps of the SDK cannot silently change `DesignDoc` shape without a major bump of [@getdesign/types](packages/types).

```ts
// Minimal usage
import { getDesign } from "getdesign";

const { markdown, doc } = await getDesign("https://cursor.com");
writeFileSync("design.md", markdown);
console.log(doc.palette.primary[0]); // typed ColorEntry
```

## 6. Non-functional requirements

| Area | Target |
|---|---|
| End-to-end latency | ≤ 90 s on a typical marketing site (measured P50) |
| Sandbox cold start | ≤ 5 s (pre-baked snapshot) |
| Hero screenshot | PNG, 1440×900 viewport, plus full-page scroll-and-stitch |
| Output token grounding | 100% of color values in `palette` must appear somewhere in the crawled CSS |
| Determinism | Re-running on the same URL within 24 h produces the same palette and typography (section 9 prose may vary) |
| Availability | Best-effort in v1; no SLA |
| Cost per run | Target ≤ $0.05 (Daytona compute + LLM tokens) |

## 7. Success metrics

- **M1 (adoption)**: ≥ 500 unique URLs processed in the first month.
- **M2 (AI-agent integration)**: at least 3 public AI tools / extensions integrating the API or TypeScript SDK.
- **M2b (SDK adoption)**: ≥ 200 weekly downloads of the `getdesign` npm package within month 2.
- **M3 (quality)**: in an internal review of 20 runs against well-known brands (cursor, linear, vercel, stripe, notion, figma, arc, raycast, and others), ≥ 18 produce a palette whose primary colors are judged "correct" by a human rater.
- **M4 (latency)**: P50 end-to-end run ≤ 90 s.
- **M5 (determinism)**: ≥ 95% palette-value overlap on repeat runs within 24 h.

## 8. Scope — in vs out

| In scope (v1) | Out of scope (v1) |
|---|---|
| Public URLs over HTTPS | Auth-gated pages, localhost, private IPs |
| Single-page snapshot | Multi-page crawl / sitemap extraction |
| Chat, API, CLI, TypeScript SDK | Figma plugin, VSCode extension, Raycast extension |
| `design.md` markdown output | JSON API, design-token JSON (W3C DTCG), CSS/Tailwind/Panda export |
| Hero + full-page screenshots | Interactive state captures (hover, menu open) |
| OpenAI GPT-5.5 class via AI Gateway | Multi-provider selection, self-hosted model |
| Convex persistence of runs | Public history browse UI |
| Read-only chat | Follow-up refinement, compare-brands, A/B diff |
| IP-based soft limits via Convex | API keys, billing, usage dashboards |

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM fabricates palette values not present in CSS | M | H | Deterministic token extraction feeds structured output; validator rejects colors not in the crawled set |
| Chromium in Daytona needs `--no-sandbox` / fails on some sites | M | M | Pre-bake snapshot and smoke-test on top 20 brands; fallback to `chromium --headless=new --screenshot` for full-page |
| Daytona snapshot cold-start > 5 s | M | M | Pre-baked snapshot + optional warm pool in v1.1 |
| OpenAI GPT-5.5 id unstable via AI Gateway | L | L | Resolve model id at startup via Gateway `/v1/models`; config-driven |
| Scroll-and-stitch artifacts on sticky headers | H | M | Inject stylesheet to hide `position: fixed` on non-first tiles, or fall back to headless full-page |
| Large sites' CSS blow up context window | M | M | Truncate each CSS source to the first 200 KB, prefer variables and `:root`/selector-scoped rules |
| Users submit malicious URLs | M | M | URL sanitization, no sandbox network egress to private IPs, auto-delete sandbox after run |
| Convex free tier limits | L | L | Monitor; upgrade when necessary |

## 10. Dependencies

- [Daytona](https://www.daytona.io/docs/en/computer-use/) — sandbox + computer-use APIs (mouse, screenshot).
- [Vercel AI SDK v6](https://ai-sdk.dev) — `ToolLoopAgent`, `streamText`, `InferAgentUIMessage`, structured output.
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — model routing (OpenAI GPT-5.5 class).
- [ai-elements](https://ai-sdk.dev/elements) on [shadcn/ui](https://ui.shadcn.com) — chat primitives.
- [Next.js 16](https://nextjs.org/docs) — web app.
- [Convex](https://docs.convex.dev) — persistence + file storage.
- [Bun](https://bun.sh) + [Turborepo](https://turborepo.com/docs) — runtime + monorepo.
- [Hono](https://hono.dev) — API app.
- [Zod v4](https://zod.dev) — schemas and structured-output validation.
- [OpenTUI](https://github.com/openturn/opentui) — CLI REPL.

## 11. Release plan

| Milestone | Deliverable | Exit criteria |
|---|---|---|
| M0 | Scaffold + architecture + PRD | This doc, [architecture.md](architecture.md), Turborepo with Bun workspaces ✓ |
| M1 | Schemas | `DesignTokens` and `DesignDoc` Zod schemas in `@getdesign/types` |
| M2 | Tools | `crawler`, `extractors`, `daytona`, `render` in `@getdesign/tools` |
| M3 | Snapshot | Custom Daytona snapshot published; `daytonaOpenUrl` + screenshot round-trip verified |
| M4 | Agents | CoordinatorAgent + 4 sub-agents in `@getdesign/agent`; end-to-end `bun run smoke.ts <url>` produces a valid `design.md` |
| M5 | Convex | Schema, actions, file storage wired |
| M6 | Web | `getdesign.app` with chat, Artifact panel, live timeline |
| M7 | API | `api.getdesign.app/?url=...` returns markdown |
| M8 | SDK | `getdesign` published on npm — `getDesign(url)` + `streamDesign(url)` typed |
| M9 | CLI | `npx getdesign <url>` one-shot + `getdesign chat` REPL, built on the SDK |
| M10 | Launch | Smoke run on top 20 brands passes M3 quality bar; web + api deployed, SDK + CLI published on npm |

## 12. Future (post-v1)

- **v1.1**: Follow-up chat ("make the palette warmer", "regenerate section 3"), IP-based rate limits via Upstash/Convex, compare-brands diff.
- **v1.2**: W3C DTCG token JSON export, Tailwind config export, Panda preset export.
- **v1.3**: VSCode extension, Raycast extension, Figma plugin.
- **v2**: Multi-page crawl, authenticated pages via user-provided cookies/Browserbase, interactive state captures.

## 13. Open questions

- Which exact OpenAI model id via AI Gateway? Resolve at implementation time.
- Do we gate the API endpoint on a soft daily limit per IP even in v1? Leaning yes (Convex-based), pending Daytona cost observation.
- Do we store raw HTML on Convex, or only extracted tokens + screenshots? Leaning tokens + screenshots + rendered markdown only (HTML is large and re-fetchable).
- Does the chat UI show a shareable permalink per run? Nice to have for v1.1 once history UI exists.
