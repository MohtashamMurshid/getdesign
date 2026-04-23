# getdesign

**On-demand design systems from any URL. One implemented web app, four planned surfaces.**

[License: MIT](./LICENSE)
[Skill: skills.sh](https://skills.sh)
[PRs Welcome](./CONTRIBUTING.md)

Paste a URL. Get a production-grade `design.md` — palette, typography, components, layout, depth, motion, responsive rules, and an agent prompt guide — **grounded in the site's actual CSS**, not hallucinated.

## Demo Video

<video src="https://raw.githubusercontent.com/MohtashamMurshid/getdesign/main/media/launch-video.mp4" controls muted playsinline width="100%">
  Your browser does not support the video tag.
</video>

[Watch or download the MP4](./media/launch-video.mp4)


| Surface | Current state |
| ------- | ------------- |
| **Web** | Implemented in [`apps/web`](./apps/web) as the landing page, `/design` showcase, and waitlist API route |
| **HTTP API** | Planned product surface; not implemented in this repo yet |
| **CLI** | Placeholder package in [`packages/cli`](./packages/cli); not a full product surface yet |
| **TypeScript SDK** | Placeholder package in [`packages/sdk`](./packages/sdk); not a full client implementation yet |
| **Agent skill** | Implemented in [`skills/getdesign`](./skills/getdesign) and installable via `npx skills add MohtashamMurshid/getdesign` |


See:

- [prd.md](./prd.md) — product requirements (what and why)
- [architecture.md](./architecture.md) — technical architecture (how)
- [skills/](./skills) — the portable agent skill (fifth surface)

## Status

Current repo state:

- `apps/web` is the main implemented surface.
- `convex/` backs the waitlist flow used by the web app.
- `packages/sdk` and `packages/cli` are intentional placeholders for future public packages.
- The agent skill in [`skills/getdesign`](./skills/getdesign) is implemented and documented.

The fuller multi-surface product architecture still lives in [architecture.md](./architecture.md), but parts of that document describe the target system rather than the code already in this repository.

## Layout

```text
apps/
  web/        Next.js 16 landing page, /design showcase, waitlist route
packages/
  cli/        Placeholder npm CLI package
  config/     Shared tsconfig package
  sdk/        Placeholder npm SDK package
  tools/      Placeholder tools package
  types/      Placeholder shared types package
convex/       Convex backend (initialized)
skills/       Agent skills (distributed via skills.sh)
```

Planned surfaces such as `apps/api`, a richer CLI, and the full SDK described in [`architecture.md`](./architecture.md) are future work and are intentionally not scaffolded in this repo yet.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20

## Install & dev

```bash
bun install
cd apps/web && bun run dev   # http://localhost:3000
```

## Quickstarts

### SDK placeholder

```ts
import { getDesign } from "@getdesign/sdk";

await getDesign("https://cursor.com");
// Throws today: the published SDK package is a private-beta placeholder.
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