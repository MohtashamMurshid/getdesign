# @getdesign/api

HTTP API for [getdesign](../../README.md). A minimal [Hono](https://hono.dev) app with versioned design endpoints:

```
GET /v1/design?url=<absolute-url>&format=json
GET /v1/design/stream?url=<absolute-url>
```

`GET /?url=<absolute-url>` remains as a markdown compatibility route.

`/v1/design` returns either `text/markdown; charset=utf-8` or JSON when `format=json`.
`/v1/design/stream` returns Server-Sent Events: `progress`, then `result` or `error`.
Every design route requires `Authorization: Bearer <WorkOS access token>`.
Request-scoped BYOK credentials are required via headers unless noted:

- `x-daytona-api-key` (optional when `x-getdesign-mode: text_only`)
- `x-openai-api-key`
- `x-getdesign-mode: text_only` to accept text-only fallback
- `x-getdesign-site-name` to override site naming

`GET /health` is unauthenticated and returns `{ "ok": true }`.

## Responses

- `200 text/markdown` — the rendered `design.md`.
- `200 application/json` — structured result for SDK clients.
- `200 text/event-stream` — progress stream for SDK/CLI clients.
- `400 application/json` — `{ "error": string }` when `url` is missing or not a valid absolute URL.
- `401 application/json` — `{ "error": "unauthorized" }` when the WorkOS bearer token is missing or invalid. Includes `WWW-Authenticate: Bearer`.
- `409 application/json` — `{ "error": "credentials_missing", "code": "credentials_missing" }` when authenticated but required BYOK headers are absent.
- `409 application/json` — capture failed (`code: capture_failed`); retry with `x-getdesign-mode: text_only` if the user accepts degraded output.
- `500 application/json` — `{ "error": "internal" }` when the agent run fails. Stack traces are logged, never returned.

## Local development

```bash
bun install                    # from repo root
bun run --cwd apps/api dev     # boots Bun.serve on :3001
curl 'http://localhost:3001/?url=https://example.com' \
  -H "Authorization: Bearer $WORKOS_ACCESS_TOKEN" \
  -H "x-daytona-api-key: $DAYTONA_API_KEY" \
  -H "x-openai-api-key: $OPENAI_API_KEY"
curl 'http://localhost:3001/v1/design?url=https://example.com&format=json' \
  -H "Authorization: Bearer $WORKOS_ACCESS_TOKEN" \
  -H "x-daytona-api-key: $DAYTONA_API_KEY" \
  -H "x-openai-api-key: $OPENAI_API_KEY"
```

`dev` uses Bun with `--hot`. The dev server shares the exact Hono app used in production (`src/app.ts`); only the transport differs.
Long capture runs can exceed Bun's default 10s idle timeout, so local dev sets
`idleTimeout=255`. Override with `IDLE_TIMEOUT_SECONDS=<seconds>` if needed.

## Tests

```bash
bun test --cwd apps/api
```

The test suite stubs `runDesign` via the factory's dependency injection, so it runs offline.

## Environment variables

Consumed by `@getdesign/agent` at request time; set them on the Vercel project with `vercel env add`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `WORKOS_CLIENT_ID` | yes | Used to fetch WorkOS JWKS and verify AuthKit access tokens. Unset means every design request is `401`. |
| `AI_GATEWAY_API_KEY` | yes | Resolved by `@getdesign/agent`'s `resolveModel()` to talk to the Vercel AI Gateway. `OPENAI_API_KEY` also accepted as a fallback. |
| `DAYTONA_API_KEY` | yes | Used by the visual sub-agent to spawn Daytona sandboxes for screenshots. |
| `GETDESIGN_MODEL` | no | Override the default OpenAI model id. |
| `PORT` | no | Local dev only; defaults to `3001`. |

No `.env` file is committed. Copy from `vercel env pull` if you want a local `.env.local`.

## Deploy

This app is a separate Vercel project, rooted at `apps/api/`.
Deploy from the monorepo root so Vercel can install Bun workspace dependencies.

```bash
vercel link --scope mohtashams-projects --project api
vercel deploy --prod --scope mohtashams-projects --local-config vercel.api.json
```

`api/index.ts` exports `config.runtime = "nodejs"` and `vercel.json` sets
`maxDuration: 300` so crawl + screenshot + synthesis has enough headroom on
cold paths.

## Layout

```
apps/api/
├── api/
│   └── index.ts          # Vercel function entry -> app.fetch
├── src/
│   ├── app.ts            # Hono factory (injectable runDesign + verifyAccessToken)
│   ├── auth.ts           # WorkOS JWT / JWKS verifier
│   ├── middleware/
│   │   └── requireAccessToken.ts
│   ├── dev.ts            # Bun.serve wrapper for local dev
│   └── handlers/
│       └── getDesign.ts  # GET / handler + Zod url validation
└── test/
    └── app.test.ts       # bun test
```
