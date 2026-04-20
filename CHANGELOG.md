# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once surfaces begin publishing.

Changes that affect the public surfaces (HTTP API, `getdesign` npm package, `getdesign` CLI, `getdesign` agent skill) are tagged with the surface in brackets, e.g. `[sdk]`, `[api]`, `[cli]`, `[skill]`, `[web]`. Shared-package changes are tagged `[types]`, `[agent]`, `[tools]`, `[ui]`.

---

## [Unreleased]

### Added

- **[skill]** New fifth surface: portable `SKILL.md` at `skills/getdesign/` that reproduces the 9-section `design.md` contract using any coding agent's built-in tools (WebFetch, browser, file write). Installable via `npx skills add MohtashamMurshid/getdesign`.
- **[skill]** `skills/getdesign/TEMPLATE.md` — field-by-field schema for each of the 9 sections, with example tables and a truncated worked example.
- **[skill]** `skills/README.md` — overview, install commands, and link to the [skills.sh](https://skills.sh) leaderboard.
- **[web]** Landing page now advertises five surfaces: hero dots `Web · API · CLI · SDK · Skill`, the Surfaces section grid expanded from 4 to 5 cards, and the interactive demo gained a `skill` tab showing `npx skills add`, agent trace (`WebFetch`, `browser.screenshot`, `Write`), and the resulting `design.md`.
- **[repo]** `LICENSE` (MIT), `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and a GitHub issue + PR template set under `.github/`.

### Changed

- **[web]** Surfaces section heading `"Four surfaces, one agent."` → `"Five surfaces, one agent."` with revised subhead.
- **[web]** Footer GitHub link now points at [github.com/MohtashamMurshid/getdesign](https://github.com/MohtashamMurshid/getdesign) instead of the `github.com` placeholder.

---

## [0.0.0] — 2026-04-20

Initial scaffold per [architecture.md §12 Delivery Order](./architecture.md#12-delivery-order).

### Added

- **[repo]** Turborepo + Bun workspace with `apps/web`, `apps/api`, `apps/cli`, `apps/docs`, `packages/{agent,tools,sdk,ui,types,config}`, `convex/`, and `infra/daytona/`.
- **[web]** Next.js 16 landing page with hero, how-it-works interactive demo, surfaces grid, final CTA, and waitlist form.
- **[convex]** Initialized Convex project.
- **[docs]** [prd.md](./prd.md) (product requirements) and [architecture.md](./architecture.md) (technical architecture).

[Unreleased]: https://github.com/MohtashamMurshid/getdesign/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/MohtashamMurshid/getdesign/releases/tag/v0.0.0
