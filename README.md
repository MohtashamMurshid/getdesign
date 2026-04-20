# getdesign

On-demand design systems from any URL — chat UI, API, and CLI.

- [prd.md](prd.md) — product requirements (what and why)
- [architecture.md](architecture.md) — technical architecture (how)

## Status

Monorepo scaffolding only. Implementation follows the delivery order in [architecture.md §12](architecture.md#12-delivery-order).

## Layout

```
apps/       web, api, cli, docs (not yet scaffolded)
packages/   agent, tools, ui, types, config
convex/     Convex backend (not yet scaffolded)
infra/      Daytona snapshot Dockerfile (not yet authored)
```

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20

## Install

```bash
bun install
```
