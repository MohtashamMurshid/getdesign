import type { Context } from "hono";
import { z } from "zod";

import type { RunDesignOptions, RunDesignResult } from "@getdesign/agent";

export type RunDesignFn = (
  url: string,
  options?: RunDesignOptions,
) => Promise<RunDesignResult>;

const urlSchema = z
  .string({ message: "Missing required query parameter: url" })
  .url({ message: "Query parameter `url` must be a valid absolute URL" });

export function createGetDesignHandler(runDesign: RunDesignFn) {
  return async (c: Context) => {
    const raw = c.req.query("url");
    const parsed = urlSchema.safeParse(raw);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid `url` query parameter";
      return c.json({ error: message }, 400);
    }

    try {
      const result = await runDesign(parsed.data);
      return c.body(result.markdown, 200, {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "no-store",
      });
    } catch (err) {
      console.error("getdesign_api_error", err);
      return c.json({ error: "internal" }, 500);
    }
  };
}
