import type { Context } from "hono";
import { z } from "zod";

import {
  RunDesignError,
  type RunDesignOptions,
  type RunDesignResult,
} from "@getdesign/agent";

export type RunDesignFn = (
  url: string,
  options?: RunDesignOptions,
) => Promise<RunDesignResult>;

const urlSchema = z
  .string({ message: "Missing required query parameter: url" })
  .url({ message: "Query parameter `url` must be a valid absolute URL" });

const TEXT_ONLY_HEADER = "x-getdesign-mode";
const DAYTONA_HEADER = "x-daytona-api-key";
const OPENAI_HEADER = "x-openai-api-key";

export function createGetDesignHandler(runDesign: RunDesignFn) {
  return async (c: Context) => {
    const raw = c.req.query("url");
    const parsed = urlSchema.safeParse(raw);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid `url` query parameter";
      return c.json({ error: message }, 400);
    }

    const requestedMode = (c.req.header(TEXT_ONLY_HEADER) ?? "").trim().toLowerCase();
    const visualRequirement: RunDesignOptions["visualRequirement"] =
      requestedMode === "text_only" ? "text_only_fallback" : "require";

    const credentials: RunDesignOptions["credentials"] = {
      daytonaApiKey: c.req.header(DAYTONA_HEADER) ?? undefined,
      openaiApiKey: c.req.header(OPENAI_HEADER) ?? undefined,
    };

    try {
      const result = await runDesign(parsed.data, {
        visualRequirement,
        credentials,
      });

      return c.body(result.markdown, 200, {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "no-store",
        "x-getdesign-mode": result.mode,
      });
    } catch (err) {
      if (err instanceof RunDesignError) {
        return c.json(
          {
            error: "capture_failed",
            code: err.code,
            reason: err.message,
            retryWith: {
              header: TEXT_ONLY_HEADER,
              value: "text_only",
              note:
                "Resend the request with this header to receive a text-only design.md.",
            },
          },
          409,
        );
      }
      console.error("getdesign_api_error", err);
      return c.json({ error: "internal" }, 500);
    }
  };
}
