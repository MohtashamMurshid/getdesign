# getdesign

**On-demand design systems from any URL. Five surfaces, one agent.**

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)
[![Skill: skills.sh](https://img.shields.io/badge/skill-skills.sh-black)](https://skills.sh)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-black.svg)](./CONTRIBUTING.md)

Paste a URL. Get a production-grade `design.md` — palette, typography, components, layout, depth, motion, responsive rules, and an agent prompt guide — **grounded in the site's actual CSS**, not hallucinated.

| Surface | How you use it |
| --- | --- |
| **Web** | [getdesign.app](https://getdesign.app) chat UI with a live `design.md` artifact panel |
| **HTTP API** | `curl "https://api.getdesign.app/?url=https://cursor.com"` → `text/markdown` |
| **CLI** | `npx getdesign <url>` — one-shot, or `getdesign chat` for an interactive REPL |
| **TypeScript SDK** | `npm i getdesign` → `const { markdown, doc } = await getDesign(url)` |
| **Agent skill** | `npx skills add MohtashamMurshid/getdesign` — runs inside Claude Code, Codex, Cursor using their built-in tools |

See:

- [prd.md](./prd.md) — product requirements (what and why)
- [architecture.md](./architecture.md) — technical architecture (how)
- [skills/](./skills) — the portable agent skill (fifth surface)

## Status

Scaffold + landing page + agent skill. Implementation of the hosted surfaces follows the delivery order in [architecture.md §12](./architecture.md#12-delivery-order). Changes are logged in [CHANGELOG.md](./CHANGELOG.md).

## Layout

```text
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
skills/       Agent skills (distributed via skills.sh)
infra/        Daytona snapshot Dockerfile (pending)
```

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20

## Install & dev

```bash
bun install
cd apps/web && bun run dev   # http://localhost:3000
```

## Quickstarts

### SDK

```ts
import { getDesign, streamDesign } from "getdesign";
import type { DesignDoc } from "getdesign";

const { markdown, doc } = await getDesign("https://cursor.com");

for await (const event of streamDesign("https://cursor.com")) {
  // typed events: phase | screenshot | tokens | delta | done | error
}
```

### Agent skill

Install into Claude Code, Codex, Cursor, or any of the [40+ supported agents](https://github.com/vercel-labs/skills#supported-agents):

```bash
npx skills add MohtashamMurshid/getdesign
```

Then prompt your agent:

> extract the design system from cursor.com into design.md

The skill drives your agent's own `WebFetch` / browser / `Write` tools — zero infrastructure, same 9-section output.

## Contributing

PRs welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md). By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

For security issues, use [GitHub private vulnerability reporting](https://github.com/MohtashamMurshid/getdesign/security/advisories/new) — see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © 2026 Mohtasham Murshid Madani
