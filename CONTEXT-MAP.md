# CONTEXT map

Multi-context layout for **getdesign**: each Bun workspace under `apps/*` and `packages/*` has a glossary at `**CONTEXT.md`** next to its `package.json` (stubs with *Terms: TBD* until you flesh them out).

Before changing code in a workspace, read that workspace’s `**CONTEXT.md*`*. Expand glossaries when language stabilizes (see `/grill-with-docs` in `docs/agents/domain.md`).

**Repo-wide ADRs:** `docs/adr/` (cross-cutting decisions).

**Workspace-scoped ADRs (optional):** `apps/<name>/docs/adr/` or `packages/<name>/docs/adr/` when decisions only affect that package.

## Apps


| Context         | CONTEXT.md path                                              | Scope                                            |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| **api**         | `[apps/api/CONTEXT.md](apps/api/CONTEXT.md)`                 | HTTP API — Bun + Hono; Vercel Node function      |
| **deck**        | `[apps/deck/CONTEXT.md](apps/deck/CONTEXT.md)`               | Launch deck — slides; PDF + editable PPTX export |
| **docs**        | `[apps/docs/CONTEXT.md](apps/docs/CONTEXT.md)`               | Documentation site — Astro / Starlight           |
| **studio**      | `[apps/studio/CONTEXT.md](apps/studio/CONTEXT.md)`           | Studio — Electron desktop app                    |
| **studio-site** | `[apps/studio-site/CONTEXT.md](apps/studio-site/CONTEXT.md)` | Studio marketing / web — Next.js                 |
| **video**       | `[apps/video/CONTEXT.md](apps/video/CONTEXT.md)`             | Video app / asset pipeline                       |
| **web**         | `[apps/web/CONTEXT.md](apps/web/CONTEXT.md)`                 | Main product web — Next.js + Convex              |
| **dashboard**   | `[apps/dashboard/CONTEXT.md](apps/dashboard/CONTEXT.md)`     | Authenticated product dashboard — Next.js + WorkOS |


## Packages


| Context     | CONTEXT.md path                                              | Scope                                                |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| **analytics** | `[packages/analytics/CONTEXT.md](packages/analytics/CONTEXT.md)` | Consent-gated marketing and dashboard analytics |
| **agent**   | `[packages/agent/CONTEXT.md](packages/agent/CONTEXT.md)`     | Coordinator + sub-agents — URL → validated DesignDoc |
| **cli**     | `[packages/cli/CONTEXT.md](packages/cli/CONTEXT.md)`         | CLI (planned)                                        |
| **config**  | `[packages/config/CONTEXT.md](packages/config/CONTEXT.md)`   | Shared TS / tooling config for workspaces            |
| **content** | `[packages/content/CONTEXT.md](packages/content/CONTEXT.md)` | Shared demo sites, surface meta, snippet builders    |
| **sdk**     | `[packages/sdk/CONTEXT.md](packages/sdk/CONTEXT.md)`         | TypeScript SDK (planned)                             |
| **tools**   | `[packages/tools/CONTEXT.md](packages/tools/CONTEXT.md)`     | Shared extraction / tool surface                     |
| **types**   | `[packages/types/CONTEXT.md](packages/types/CONTEXT.md)`     | Shared types, schemas — DesignDoc, tokens, etc.      |


## Root (optional)

There is no requirement for a root `[CONTEXT.md](CONTEXT.md)`. Use one only if you want a single glossary that spans the whole monorepo; otherwise rely on the workspace files above.