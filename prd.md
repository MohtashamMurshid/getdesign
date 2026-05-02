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

`getdesign` is an agent that opens the URL in a real browser (inside a Daytona sandbox), captures the actual rendered landing page, extracts CSS tokens deterministically, and synthesizes a structured 9-section design specification matching the reference Cursor-style template. Delivered through four surfaces sharing one agent core:

1. **Chat UI** at `getdesign.app` — paste a URL, watch the agent work live, read the resulting `design.md`.
2. **HTTP API** at `api.getdesign.app/?url=...` — returns raw markdown for scripts, CI, and other agents.
3. **CLI** `npx @getdesign/cli <url>` — one-shot or interactive REPL for local use.
4. **TypeScript SDK** `npm i @getdesign/sdk` — a typed client for Node/Bun/Deno/Edge. `await getDesign(url)` returns `{ markdown, doc }` where `doc` is the fully-typed `DesignDoc`. `streamDesign(url)` yields typed progress events for custom UIs.

## 3. Goals and non-goals

### Current TODOs

- Add a dashboard-style gallery of famous websites where we use the `getdesign` skill to fetch and display each site's generated `design.md`.
- Add a benchmark view showing how similar generated `design.md` outputs are across different models.

### Goals (v1)

- **G1**: Given any public marketing or product URL, return a `design.md` that follows the 9-section template exactly (see [architecture.md §5](architecture.md#5-9-section-schema-exact-template)).
- **G2**: Output palette values that are grounded in the site's actual computed styles, not hallucinated.
- **G3**: Capture the actual rendered landing page from top to document bottom, with canonical capture tiles and a derived stitched full-page preview.
- **G4**: Four surfaces (web chat, HTTP API, CLI, TypeScript SDK) share the same agent package; no per-surface drift.
- **G5**: Cold-start an end-to-end run in ≤ 5 s of Daytona boot time; complete a full run in ≤ 90 s on a typical marketing site.
- **G6**: V1 is BYOK-only: authenticated users provide their own Daytona and OpenAI credentials, either stored in Convex for web reuse or sent with an API/SDK/CLI run, and getdesign does not bill or subsidize variable run costs.

### Non-goals (v1)

- No follow-up chat / refinement ("make the palette warmer"). Read-only generation.
- No compare-brands / diff mode.
- No getdesign billing, subscriptions, or platform-funded run credits.
- No interactive states (hover, open menu). Full landing page capture only.
- No generation of runnable code (React components, Tailwind config). Output is a spec doc.
- No PDF / Figma / Sketch export. Markdown only.

## 4. Users and primary scenarios

### P0 — AI coding agents

An agent (Cursor, Claude Code, v0, Devin, etc.) is asked "make this landing page look like cursor.com". Today it hallucinates. Tomorrow it calls the authenticated `api.getdesign.app/?url=https://cursor.com` endpoint — or imports `@getdesign/sdk` — sending Daytona and OpenAI keys with the run request, then feeds the resulting `design.md` into its own context. This is the highest-leverage user.

### P0b — Developers embedding `getdesign` in other apps

A developer building a design tool, an onboarding flow, or an AI product wants to programmatically pull a brand spec. They `npm i @getdesign/sdk`, authenticate against their getdesign account, call `await getDesign(url, { credentials })`, and get back a Zod-typed `DesignDoc` they can render, diff, or persist however they like. This is why the SDK ships alongside the hosted API.

### P1 — Designers evaluating a brand

A designer wants to quickly spec out a style guide inspired by a reference. They open the chat UI, paste the URL, watch the agent run, and export the markdown.

### P2 — Developers building style systems

A developer needs to match an existing brand in a new repo. They run `DAYTONA_API_KEY=... OPENAI_API_KEY=... npx @getdesign/cli https://linear.app > design.md`, commit it, and feed it to their team's chosen AI tool.

## 5. Functional requirements

### F1 — Input

- Accept any public URL over HTTPS.
- Reject URLs that are clearly not brand/product pages (`localhost`, private IPs, empty pages).
- Chat UI: [`PromptInput`](https://ai-sdk.dev/elements/prompt-input) accepts a URL and a submit; validate client-side with the WHATWG URL parser before submitting.

### F2 — Agent run

Every run executes, in order:

1. **Authorize** — require an authenticated user plus Daytona and OpenAI credentials, either request-scoped for the current API/SDK/CLI run or stored in Convex for web reuse.
2. **Crawl** — fetch HTML, all linked stylesheets, `@import` chains, and `@font-face` sources over HTTPS. Runs in Bun on the API server; does not require the sandbox.
3. **Ensure capture runtime** — resolve the user's per-account capture snapshot for the current `CAPTURE_RUNTIME_VERSION`. If it does not yet exist in `active` state, create it from the pinned public capture runtime image and wait. Web does this as an explicit setup step; API/CLI runs auto-ensure on first use and emit `capture_runtime` status events.
4. **Spawn sandbox** — use the authenticated user's Daytona credential with `daytona.create({ snapshot: 'getdesign-capture-<runtimeVersion>' })` + `sandbox.computerUse.start()`.
5. **Open URL** — launch Chromium kiosk inside the sandbox's Xvfb display via `sandbox.process.executeCommand`.
6. **Capture rendered page** — measure the actual rendered document height in Chromium, dismiss or hide common visual blockers when possible, capture viewport-sized tiles via `sandbox.computerUse.screenshot.takeCompressed`, dedupe repeated fixed/sticky elements after the first tile, and derive a stitched full-page preview from the tiles.
7. **Extract tokens** — deterministic CSS parsing → `DesignTokens` Zod object (colors, typography, spacing, radii, shadows, borders, breakpoints).
8. **Synthesize** — LLM call using the authenticated user's OpenAI credential produces a structured `DesignDoc` conforming to the 9-section Zod schema. Vision input = curated visual synthesis subset + tokens JSON + crawl notes.
9. **Render** — deterministic markdown renderer converts `DesignDoc` → final `design.md`.
10. **Persist** — write run, tokens, capture tiles, stitched preview, capture metadata, runtime version, run mode (`visual` vs `text_only`), and final doc to Convex.
11. **Teardown** — `sandbox.delete()`.

If step 3 cannot reach an `active` capture snapshot (quota, build failure, registry error, timeout) or step 6 cannot complete after the in-tool retry budget, the run fails with `capture_runtime_unavailable` (or `capture_failed`) and the user is offered an explicit text-only re-run instead of silently degrading.

### F2a — Auth, credentials, and pricing

- V1 uses Clerk for authentication.
- V1 is BYOK-only. Users must provide one Daytona key and one OpenAI key before starting a run.
- Web runs use Convex-stored credentials by default after setup.
- API, SDK, and CLI runs may send request-scoped Daytona and OpenAI credentials with the run request instead of relying on stored credentials.
- Convex stores user identity, optional credential metadata, encrypted credential payloads, runs, captures, and artifacts.
- getdesign does not bill users in v1 and does not provide shared Daytona or OpenAI credits.
- Users pay Daytona and OpenAI directly according to those providers' pricing.
- The credential model includes a provider field so additional LLM providers can be added later without changing the user-funded run model. V1 only supports OpenAI for synthesis.
- Request-scoped credentials must be sent over authenticated HTTPS in headers or request body fields, never in query parameters, and must not be persisted or logged unless the user explicitly saves them.
- Raw stored credentials are never displayed after save; the UI may show masked suffixes and last-updated timestamps.

### F2b — Capture runtime provisioning

- The capture runtime is a public, versioned OCI image published by getdesign (built from `infra/daytona/Dockerfile`, pinned by digest on GHCR). The image is not user-configurable in v1.
- Each user owns their own immutable Daytona snapshot per runtime version, named `getdesign-capture-<runtimeVersion>`. The snapshot is created in the user's Daytona account using their key and reused across runs.
- Web shows an explicit "Connect Daytona" setup that calls `ensureDaytonaCaptureSnapshot` and surfaces `provisioning` / `ready` / `failed` status. Visual runs are not started until status is `ready`.
- API, SDK, and CLI runs auto-ensure the snapshot on the first run with a given Daytona credential and emit `provisioning_capture_runtime` / `capture_runtime_ready` / `capture_runtime_failed` status events while waiting.
- Provisioning failures surface a clear, actionable error (quota, build failure, permissions, timeout) with the snapshot name. getdesign never falls back to platform-funded Daytona capacity.
- v1 does not auto-delete getdesign-created snapshots from the user's account. Bumping `CAPTURE_RUNTIME_VERSION` creates a new snapshot alongside any older versions; cleanup is a future explicit user action.

### F2c — Text-only fallback

- When visual capture is unavailable (no Daytona key, snapshot provisioning failure, capture failure after retries) the run does not silently degrade. The user is offered an explicit text-only re-run.
- Text-only runs still produce a `design.md`, but with a clear "text-only mode" banner so downstream consumers know the visual sections were derived from CSS tokens alone.
- Hosted UI / API / CLI all expose the same opt-in:
  - Web: "Continue with text-only" button on the capture-unavailable error.
  - API: `x-getdesign-mode: text_only` header on the retry request; the response includes `x-getdesign-mode: text_only`.
  - CLI: `--text-only` flag.
- The run record stores `mode: 'visual' | 'text_only'` so analytics and history can distinguish the two.

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
  - `Image` renders capture progress and the stitched full-page preview when ready.
  - `Sources` lists the CSS source URLs consulted.
  - `Artifact` side panel shows the growing `design.md` as markdown.
- Read-only. No follow-up messages.

### F5 — API behavior

- `GET https://api.getdesign.app/?url=<encoded-url>` → `200 text/markdown; charset=utf-8` with the final `design.md` for authenticated users who either have stored Daytona/OpenAI credentials or send request-scoped credentials with the request.
- `400` on missing/invalid URL.
- `401` when unauthenticated.
- `402` or `409` when required BYOK credentials are missing or invalid.
- `409 capture_runtime_unavailable` when the user's Daytona capture snapshot is not ready or capture failed; the response body includes the snapshot name and a `retryWith` hint pointing to the `x-getdesign-mode: text_only` header.
- Successful `200` responses include an `x-getdesign-mode: visual|text_only` response header.
- Optional request headers: `x-daytona-api-key` and `x-openai-api-key` for request-scoped BYOK credentials, and `x-getdesign-mode: text_only` to opt into the text-only fallback after a prior `409`.
- `502` if the target URL cannot be reached.
- `504` on agent timeout (> 120 s).
- No streaming in v1. No JSON endpoint in v1.

### F6 — CLI behavior

- `npx @getdesign/cli <url>` — one-shot. Prints streaming progress to stderr (phases + partial markdown). Writes final `design.md` to stdout or to `--out <path>`.
- `npx @getdesign/cli` (no URL) — interactive REPL via [OpenTUI](https://github.com/openturn/opentui); same transport as the web chat.
- `npx @getdesign/cli --version`, `--help`.
- When `DAYTONA_API_KEY` + `OPENAI_API_KEY` are set locally, the CLI either calls the agent directly or forwards those keys as request-scoped credentials to the hosted API. Without local keys, it calls the hosted API using the authenticated account's stored BYOK credentials.
- The CLI auto-ensures the per-user capture snapshot in direct mode using the same `ensureDaytonaCaptureSnapshot` helper as the hosted API, and prints `provisioning_capture_runtime` / `capture_runtime_ready` status.
- `--text-only` opts into the text-only fallback when the capture runtime is unavailable.
- Internally implemented on top of the TypeScript SDK (F7) so we keep one transport layer.

### F7 — TypeScript SDK behavior

Published as [`@getdesign/sdk`](https://www.npmjs.com/package/@getdesign/sdk) on npm. Two entry points:

- `getDesign(url, options?): Promise<{ markdown: string; doc: DesignDoc; runId: string }>` — one-shot call to the hosted HTTP API; returns the final markdown plus a fully-typed `DesignDoc`.
- `streamDesign(url, options?): AsyncIterable<DesignEvent>` — connects to the streaming endpoint and yields typed events: `phase`, `screenshot`, `tokens`, `delta`, `done`, `error`.

Requirements:

- **Runtimes**: Node ≥ 20, Bun ≥ 1.2, Deno, Cloudflare Workers, Vercel Edge. Web Fetch + Web Streams only.
- **Typing**: all events and results are fully typed. `DesignDoc` and `DesignTokens` types are re-exported from the package root.
- **Bundle**: ESM-only, `zod@^4` as the single peer dep, tree-shakeable (`streamDesign` code split from `getDesign`).
- **Options**: `{ baseUrl?: string; fetch?: typeof fetch; signal?: AbortSignal; accessToken?: string; credentials?: { daytonaApiKey: string; openaiApiKey: string } }`. `baseUrl` overrides the default `https://api.getdesign.app`; `fetch` and `signal` enable custom transports and cancellation; `accessToken` authenticates hosted API calls; `credentials` sends request-scoped BYOK credentials for the run.
- **Versioning**: SemVer; major bumps of the SDK cannot silently change `DesignDoc` shape without a major bump of [@getdesign/types](packages/types).

```ts
// Minimal usage
import { getDesign } from "@getdesign/sdk";

const { markdown, doc } = await getDesign("https://cursor.com");
writeFileSync("design.md", markdown);
console.log(doc.palette.primary[0]); // typed ColorEntry
```

## 6. Non-functional requirements

| Area | Target |
|---|---|
| End-to-end latency | ≤ 90 s on a typical marketing site (measured P50) |
| Sandbox cold start | ≤ 5 s (pre-baked snapshot) |
| Full landing page capture | Canonical viewport-sized capture tiles from actual rendered document height, plus derived stitched preview |
| Output token grounding | 100% of color values in `palette` must appear somewhere in the crawled CSS |
| Determinism | Re-running on the same URL within 24 h produces the same palette and typography (section 9 prose may vary) |
| Availability | Best-effort in v1; no SLA |
| Pricing | BYOK-only; users pay Daytona and OpenAI directly, with no getdesign billing in v1 |
| Cost visibility | Show estimated Daytona/LLM usage per run when provider data is available |

## 7. Success metrics

- **M1 (adoption)**: ≥ 500 unique URLs processed in the first month.
- **M2 (AI-agent integration)**: at least 3 public AI tools / extensions integrating the API or TypeScript SDK.
- **M2b (SDK adoption)**: ≥ 200 weekly downloads of `@getdesign/sdk` within month 2.
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
| Actual rendered full landing page capture | Interactive state captures (hover, menu open) |
| OpenAI via user-provided key | Multi-provider selection, self-hosted model |
| Convex persistence of runs | Public history browse UI |
| Read-only chat | Follow-up refinement, compare-brands, A/B diff |
| Clerk auth + BYOK credentials, stored or request-scoped | getdesign billing, subscriptions, shared credits |

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM fabricates palette values not present in CSS | M | H | Deterministic token extraction feeds structured output; validator rejects colors not in the crawled set |
| Chromium in Daytona needs `--no-sandbox` / fails on some sites | M | M | Pre-bake snapshot, launch via `getdesign-chromium`, and smoke-test on top 20 brands; fallback to `chromium --headless=new --screenshot` only after primary Daytona capture fails |
| Daytona snapshot cold-start > 5 s | M | M | Pre-baked snapshot + optional warm pool in v1.1 |
| Default OpenAI model choice changes | L | L | Keep the model id config-driven and record the model used on each run |
| Tile stitching artifacts on sticky headers or overlays | H | M | Browser-side overlay cleanup, fixed-element dedupe after the first tile, capture metadata, and visual smoke tests on common landing-page patterns |
| Lazy-loaded or infinite pages never reach stable height | M | M | Continue measuring while height grows; fail with a clear capture error if stable rendered height is not reached within guardrails |
| Users are uncomfortable storing provider keys | M | H | Support request-scoped API/SDK/CLI credentials, encrypt stored credential payloads, show masked metadata only, and document local env-var direct mode |
| Provider key is missing, invalid, or quota-limited | H | M | Block runs until credentials are provided for the request or configured on the account; surface provider-specific errors without logging raw secrets |
| Large sites' CSS blow up context window | M | M | Truncate each CSS source to the first 200 KB, prefer variables and `:root`/selector-scoped rules |
| Users submit malicious URLs | M | M | URL sanitization, no sandbox network egress to private IPs, auto-delete sandbox after run |
| Convex free tier limits | L | L | Monitor; upgrade when necessary |

## 10. Dependencies

- [Daytona](https://www.daytona.io/docs/en/computer-use/) — sandbox + computer-use APIs (mouse, screenshot).
- [Vercel AI SDK v6](https://ai-sdk.dev) — `ToolLoopAgent`, `streamText`, `InferAgentUIMessage`, structured output.
- OpenAI — v1 synthesis provider through user-provided credentials.
- Clerk — user authentication.
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
| M3 | Snapshot + capture | Custom Daytona snapshot published; `daytonaOpenUrl` + actual rendered full landing page tile capture verified |
| M4 | Agents | CoordinatorAgent + 4 sub-agents in `@getdesign/agent`; end-to-end `bun run smoke.ts <url>` produces a valid `design.md` |
| M5 | Auth + credentials | Clerk auth wired; Convex stores encrypted Daytona/OpenAI credentials with one active credential of each type per user; API/SDK/CLI accept request-scoped credentials |
| M6 | Convex | Schema, actions, file storage wired |
| M7 | Web | `getdesign.app` with sign-in, credential setup, chat, Artifact panel, live timeline |
| M8 | API | `api.getdesign.app/?url=...` requires auth + stored or request-scoped BYOK credentials and returns markdown |
| M9 | SDK | `@getdesign/sdk` published on npm — `getDesign(url)` + `streamDesign(url)` typed |
| M10 | CLI | `npx @getdesign/cli <url>` one-shot + `npx @getdesign/cli` REPL, built on the SDK |
| M11 | Launch | Smoke run on top 20 brands passes M3 quality bar; web + api deployed, SDK + CLI published on npm |

## 12. Future (post-v1)

- **v1.1**: Follow-up chat ("make the palette warmer", "regenerate section 3"), compare-brands diff, additional LLM providers.
- **v1.2**: W3C DTCG token JSON export, Tailwind config export, Panda preset export.
- **v1.3**: VSCode extension, Raycast extension, Figma plugin.
- **v2**: Multi-page crawl, authenticated pages via user-provided cookies/Browserbase, interactive state captures.

## 13. Open questions

- Which exact OpenAI model id should v1 default to when using the user's OpenAI key? Resolve at implementation time.
- Which encryption approach should protect Convex-stored provider credentials?
- Do we store raw HTML on Convex, or only extracted tokens + capture artifacts + rendered markdown? Leaning tokens + capture artifacts + rendered markdown only (HTML is large and re-fetchable).
- Does the chat UI show a shareable permalink per run? Nice to have for v1.1 once history UI exists.
