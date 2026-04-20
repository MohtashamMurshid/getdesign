# @getdesign/api

HTTP API for [getdesign](../../README.md). A minimal [Hono](https://hono.dev) app with a single endpoint:

```
GET /?url=<absolute-url>
```

Returns `text/markdown; charset=utf-8` — the final `design.md` produced by `@getdesign/agent`'s `runDesign` driver. Read-only, no auth, no streaming in v1 (see [`architecture.md`](../../architecture.md) §1, §7, §10).

## Responses

- `200 text/markdown` — the rendered `design.md`.
- `400 application/json` — `{ "error": string }` when `url` is missing or not a valid absolute URL.
- `500 application/json` — `{ "error": "internal" }` when the agent run fails. Stack traces are logged, never returned.

## Local development

```bash
bun install                    # from repo root
bun run --cwd apps/api dev     # boots Bun.serve on :3001
curl 'http://localhost:3001/?url=https://example.com'
```

`dev` uses Bun with `--hot`. The dev server shares the exact Hono app used in production (`src/app.ts`); only the transport differs.

## Tests

```bash
bun test --cwd apps/api
```

The test suite stubs `runDesign` via the factory's dependency injection, so it runs offline.

## Environment variables

Consumed by `@getdesign/agent` at request time; set them on the Vercel project with `vercel env add`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | yes | Resolved by `@getdesign/agent`'s `resolveModel()` to talk to the Vercel AI Gateway. `OPENAI_API_KEY` also accepted as a fallback. |
| `DAYTONA_API_KEY` | yes | Used by the visual sub-agent to spawn Daytona sandboxes for screenshots. |
| `GETDESIGN_MODEL` | no | Override the default OpenAI model id. |
| `PORT` | no | Local dev only; defaults to `3001`. |

No `.env` file is committed. Copy from `vercel env pull` if you want a local `.env.local`.

## Deploy

This app is a separate Vercel project, rooted at `apps/api/`.

```bash
cd apps/api
vercel link
vercel env add AI_GATEWAY_API_KEY
vercel env add DAYTONA_API_KEY
vercel deploy --prod
```

`vercel.json` pins the handler to the Node runtime with `maxDuration: 300` so crawl + screenshot + synthesis has enough headroom on cold paths.

## Layout

```
apps/api/
├── api/
│   └── index.ts          # Vercel function entry -> app.fetch
├── src/
│   ├── app.ts            # Hono factory (injectable runDesign)
│   ├── dev.ts            # Bun.serve wrapper for local dev
│   └── handlers/
│       └── getDesign.ts  # GET / handler + Zod url validation
└── test/
    └── app.test.ts       # bun test
```
