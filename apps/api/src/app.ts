import { Hono } from "hono";

import type { RunDesignFn } from "./handlers/getDesign";
import {
  createGetDesignHandler,
  createStreamDesignHandler,
} from "./handlers/getDesign";

export type CreateAppOptions = {
  runDesign: RunDesignFn;
};

export function createApp({ runDesign }: CreateAppOptions): Hono {
  const app = new Hono();

  app.get("/", createGetDesignHandler(runDesign));
  app.get("/v1/design", createGetDesignHandler(runDesign));
  app.get("/v1/design/stream", createStreamDesignHandler(runDesign));

  return app;
}
