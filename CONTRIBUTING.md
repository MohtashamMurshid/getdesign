# Contributing to getdesign

Thanks for your interest in `getdesign` — on-demand design systems from any URL. This doc covers how to get the monorepo running locally, the rules each surface plays by, and how to propose changes.

By participating in this project you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Before you start

- Read [prd.md](./prd.md) for product intent and non-goals.
- Read [architecture.md](./architecture.md) for the system design (sub-agents, Daytona, Convex, schemas).
- File an issue or start a discussion before large changes. Drive-by PRs that change the 9-section schema, the agent topology, or the public SDK surface are unlikely to be merged without prior design alignment.

## Repository layout

This is a Turborepo + Bun workspace:

```
apps/
  web/        Next.js 16 landing + chat (live)
  api/        Bun + Hono HTTP API (pending)
  cli/        Bun CLI (pending)
  docs/       MDX reference (pending)
packages/
  agent/      ToolLoopAgent + sub-agents (pending)
  tools/      Crawler, extractors, Daytona, renderer (pending)
  sdk/        `getdesign` npm package (pending)
  ui/         Shared React components (pending)
  types/      Zod schemas: DesignTokens, DesignDoc (pending)
  config/     Shared tsconfig
convex/       Convex backend
skills/       Agent skills distributed via skills.sh
```

See [architecture.md](./architecture.md) §2 for the full map and rationale.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20
- A [Convex](https://convex.dev) account (free tier is fine) for local backend work.
- Optional for full agent runs: `DAYTONA_API_KEY`, `OPENAI_API_KEY` or an AI Gateway token.

## Local development

```bash
git clone https://github.com/MohtashamMurshid/getdesign.git
cd getdesign
bun install

# Run the web app
cd apps/web && bun run dev
# → http://localhost:3000
```

To work on the agent skill without the monorepo, install it into any project:

```bash
npx skills add MohtashamMurshid/getdesign --skill getdesign
```

## How to propose a change

1. **Open an issue first** for anything larger than a typo or lint fix. Describe the problem, the proposed change, and which surface(s) it affects (web, API, CLI, SDK, skill, shared packages).
2. **Branch from `main`**: `git checkout -b <kind>/<short-slug>` where `<kind>` is one of `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.
3. **Keep PRs small and scoped.** One concern per PR. Cross-package refactors should be split into reviewable chunks.
4. **Update [CHANGELOG.md](./CHANGELOG.md)** under `## [Unreleased]` in the appropriate section (Added / Changed / Fixed / Removed / Deprecated / Security).
5. **Run the checks** before pushing:
   ```bash
   bun run lint        # at repo root, runs turbo lint
   bun run typecheck   # at repo root, runs turbo typecheck
   ```
6. **Open a PR** against `main`. Fill in the template. Link the issue.

## Commit + PR conventions

We use [Conventional Commits](https://www.conventionalcommits.org):

```
feat(web): add skill surface card
fix(skill): ground palette values in :root variables only
docs(architecture): clarify scroll-and-stitch fallback
```

Scopes map to workspace roots (`web`, `api`, `cli`, `sdk`, `agent`, `tools`, `types`, `ui`, `skill`, `convex`, `infra`). Use `repo` for monorepo-wide changes.

PR titles follow the same format. PR bodies should include:

- **What** changed (bulleted)
- **Why** (link to issue)
- **Surfaces affected** (web / api / cli / sdk / skill / shared)
- **Screenshots** for any web UI change
- **Migration notes** if the change is user-visible (SDK type, API response, skill contract)

## Surface-specific rules

### Agent skill (`skills/getdesign/`)

- The 9-section output contract in [SKILL.md](./skills/getdesign/SKILL.md) and [TEMPLATE.md](./skills/getdesign/TEMPLATE.md) is **frozen** in v1. Do not reorder, merge, split, or rename sections without a major-version bump of the skill and a migration note.
- Keep `SKILL.md` under 500 lines. Push detail into reference files.
- Grounding rule is non-negotiable: every hex, font, size, and breakpoint must be traceable to fetched CSS or a real screenshot pixel. PRs that weaken grounding will be rejected.
- Run a smoke test on at least 3 real URLs (e.g. `cursor.com`, `linear.app`, `stripe.com`) with the agent of your choice and paste the resulting `design.md` fragments in the PR.

### TypeScript SDK (`packages/sdk/`)

- `DesignDoc` and `DesignTokens` are the contract. Changing their shape requires a major-version bump of both `@getdesign/types` and `getdesign`.
- ESM-only. Web Fetch + Web Streams only (no Node-specifics) so it runs on Deno, Cloudflare Workers, and Vercel Edge.
- `zod@^4` is the only peer dependency.

### HTTP API (`apps/api/`)

- v1 is read-only, no auth, `GET /?url=…` returns `text/markdown`. Preserve that contract; add new capabilities under new paths.

### Web + chat UI (`apps/web/`)

- Chat primitives come from [ai-elements](https://ai-sdk.dev/elements) on top of [shadcn/ui](https://ui.shadcn.com). Prefer composing existing primitives over writing custom chat widgets.
- Do not add emojis to UI copy or code comments.
- Follow [apps/web/CLAUDE.md](./apps/web/CLAUDE.md) and [apps/web/AGENTS.md](./apps/web/AGENTS.md) for app-local conventions.

### Convex backend (`convex/`)

- Follow the Convex rules in [`.cursor/rules/`](./.cursor/rules) (argument validation, function organization, no `Date.now()` in queries, pagination for large datasets, etc.).

## Testing

- Unit-level tests live alongside their package (`packages/*/test/`).
- The skill has no automated tests in v1 — it is exercised by running against real URLs with your chosen agent and reviewing the output.

## Security

Please do **not** open a public issue for security reports. See [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
