import { Hono } from "hono";

import { verifyWorkosAccessToken, type VerifyAccessTokenFn } from "./auth";
import type { RunDesignFn } from "./handlers/getDesign";
import {
  createGetDesignHandler,
  createStreamDesignHandler,
} from "./handlers/getDesign";
import { requireAccessToken } from "./middleware/requireAccessToken";

export type { VerifyAccessTokenFn };

export type CreateAppOptions = {
  runDesign: RunDesignFn;
  verifyAccessToken?: VerifyAccessTokenFn;
};

export function createApp({
  runDesign,
  verifyAccessToken = verifyWorkosAccessToken,
}: CreateAppOptions): Hono {
  const app = new Hono();
  const requireAuth = requireAccessToken(verifyAccessToken);

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/", requireAuth, createGetDesignHandler(runDesign));
  app.get("/v1/design", requireAuth, createGetDesignHandler(runDesign));
  app.get(
    "/v1/design/stream",
    requireAuth,
    createStreamDesignHandler(runDesign),
  );

  return app;
}
