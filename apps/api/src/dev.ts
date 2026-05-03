#!/usr/bin/env bun
/**
 * Local development server. Boots the Hono app with the real `runDesign`
 * driver on `PORT` (default 3001). For BYOK dogfooding, pass Daytona and
 * OpenAI credentials on the request headers used by the SDK/CLI.
 */
import { runDesign } from "@getdesign/agent";

import { createApp } from "./app";

const app = createApp({ runDesign });
const port = Number(process.env.PORT ?? 3001);
const idleTimeout = Number(process.env.IDLE_TIMEOUT_SECONDS ?? 255);

const server = Bun.serve({
  port,
  idleTimeout,
  fetch: app.fetch,
});

process.stderr.write(
  `[getdesign-api] listening on http://localhost:${server.port} (idleTimeout=${idleTimeout}s)\n`,
);
