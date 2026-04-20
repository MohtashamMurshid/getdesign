#!/usr/bin/env bun
/**
 * Local development server. Boots the Hono app with the real `runDesign`
 * driver on `PORT` (default 3001). Requires `AI_GATEWAY_API_KEY` +
 * `DAYTONA_API_KEY` in the environment for a real end-to-end run.
 */
import { runDesign } from "@getdesign/agent";

import { createApp } from "./app";

const app = createApp({ runDesign });
const port = Number(process.env.PORT ?? 3001);

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

process.stderr.write(`[getdesign-api] listening on http://localhost:${server.port}\n`);
