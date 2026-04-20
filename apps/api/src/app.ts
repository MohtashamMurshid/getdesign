import { Hono } from "hono";

import type { RunDesignFn } from "./handlers/getDesign";
import { createGetDesignHandler } from "./handlers/getDesign";

export type CreateAppOptions = {
  runDesign: RunDesignFn;
};

export function createApp({ runDesign }: CreateAppOptions): Hono {
  const app = new Hono();

  app.get("/", createGetDesignHandler(runDesign));

  return app;
}
