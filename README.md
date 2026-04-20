# getdesign

On-demand design systems from any URL. Four surfaces, one agent.

- **Web** — chat UI at `getdesign.app`
- **API** — `GET api.getdesign.app/?url=...` returning `text/markdown`
- **CLI** — `npx getdesign <url>`
- **TypeScript SDK** — `npm i getdesign` → `await getDesign(url)` returns a typed `DesignDoc`

See:

- [prd.md](prd.md) — product requirements (what and why)
- [architecture.md](architecture.md) — technical architecture (how)

## Status

Scaffold + landing page only. Implementation follows the delivery order in [architecture.md §12](architecture.md#12-delivery-order).

## Layout

```
apps/
  web/        Next.js 16 landing + chat (scaffolded)
  api/        Bun + Hono HTTP API (pending)
  cli/        Bun CLI (pending)
  docs/       MDX reference (pending)
packages/
  agent/      ToolLoopAgent + sub-agents (pending)
  tools/      Crawler, extractors, Daytona, renderer (pending)
  sdk/        `getdesign` npm package — typed HTTP client (pending)
  ui/         Shared React components (pending)
  types/      Zod schemas: DesignTokens, DesignDoc (pending)
  config/     Shared tsconfig
convex/       Convex backend (initialized)
infra/        Daytona snapshot Dockerfile (pending)
```

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20

## Install

```bash
bun install
```

## Dev

```bash
cd apps/web && bun run dev   # landing page at http://localhost:3000
```

## SDK preview

```ts
import { getDesign, streamDesign } from "getdesign";
import type { DesignDoc } from "getdesign";

const { markdown, doc } = await getDesign("https://cursor.com");

for await (const event of streamDesign("https://cursor.com")) {
  // typed events: phase | screenshot | tokens | delta | done | error
}
```
