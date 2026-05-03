import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";

import {
  RunDesignError,
  type RunDesignEvent,
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
const SITE_NAME_HEADER = "x-getdesign-site-name";

type ResponseFormat = "markdown" | "json";

function parseVisualRequirement(c: Context): RunDesignOptions["visualRequirement"] {
  const requestedMode = (c.req.header(TEXT_ONLY_HEADER) ?? "").trim().toLowerCase();
  return requestedMode === "text_only" ? "text_only_fallback" : "require";
}

function parseCredentials(c: Context): RunDesignOptions["credentials"] {
  return {
    daytonaApiKey: c.req.header(DAYTONA_HEADER) ?? undefined,
    openaiApiKey: c.req.header(OPENAI_HEADER) ?? undefined,
  };
}

function parseSiteName(c: Context): string | undefined {
  return c.req.query("siteName") ?? c.req.header(SITE_NAME_HEADER) ?? undefined;
}

function parseFormat(c: Context): ResponseFormat {
  const format = (c.req.query("format") ?? "").trim().toLowerCase();
  if (format === "json") return "json";
  return "markdown";
}

function jsonResult(result: RunDesignResult) {
  return {
    url: result.url,
    markdown: result.markdown,
    doc: result.doc,
    tokens: result.tokens,
    visualDescription: result.visualDescription,
    tiles: result.tiles,
    mode: result.mode,
  };
}

function publicEvent(event: RunDesignEvent) {
  if (event.phase === "capture") {
    return {
      phase: "capture",
      capturePhase: event.event.phase,
      status: event.event.status,
      detail: event.event.detail,
      durationMs: event.event.durationMs,
    };
  }

  if (event.phase === "crawl") {
    return event.status === "start"
      ? { phase: "crawl", status: "start" }
      : {
          phase: "crawl",
          status: "ok",
          siteName: event.crawl.siteName,
          stylesheets: event.crawl.stylesheets.length,
        };
  }

  if (event.phase === "visual") {
    return event.status === "start"
      ? { phase: "visual", status: "start" }
      : { phase: "visual", status: "ok", visualStatus: event.visual.status };
  }

  if (event.phase === "describe") {
    return { phase: "describe", status: event.status, detail: event.detail };
  }

  if (event.phase === "extract") {
    return event.status === "start"
      ? { phase: "extract", status: "start" }
      : {
          phase: "extract",
          status: "ok",
          fontFamilies: event.tokens.typography.fontFamilies.length,
        };
  }

  if (event.phase === "synthesize") {
    return event.status === "start"
      ? { phase: "synthesize", status: "start" }
      : {
          phase: "synthesize",
          status: "ok",
          paletteGroups: event.doc.palette.groups.length,
        };
  }

  if (event.phase === "render") {
    return event.status === "start"
      ? { phase: "render", status: "start" }
      : { phase: "render", status: "ok", markdownLength: event.markdown.length };
  }

  return { phase: "run", status: "working" };
}

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
      const result = await runDesign(parsed.data, {
        visualRequirement: parseVisualRequirement(c),
        credentials: parseCredentials(c),
        siteName: parseSiteName(c),
      });

      if (parseFormat(c) === "json") {
        return c.json(jsonResult(result), 200, {
          "cache-control": "no-store",
          "x-getdesign-mode": result.mode,
        });
      }

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

export function createStreamDesignHandler(runDesign: RunDesignFn) {
  return async (c: Context) => {
    const raw = c.req.query("url");
    const parsed = urlSchema.safeParse(raw);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid `url` query parameter";
      return c.json({ error: message }, 400);
    }

    return streamSSE(c, async (stream) => {
      try {
        const result = await runDesign(parsed.data, {
          visualRequirement: parseVisualRequirement(c),
          credentials: parseCredentials(c),
          siteName: parseSiteName(c),
          onPhase: async (event) => {
            await stream.writeSSE({
              event: "progress",
              data: JSON.stringify(publicEvent(event)),
            });
          },
        });

        await stream.writeSSE({
          event: "result",
          data: JSON.stringify(jsonResult(result)),
        });
      } catch (err) {
        if (err instanceof RunDesignError) {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({
              error: "capture_failed",
              code: err.code,
              reason: err.message,
              retryWith: {
                header: TEXT_ONLY_HEADER,
                value: "text_only",
              },
            }),
          });
          return;
        }

        console.error("getdesign_api_stream_error", err);
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ error: "internal" }),
        });
      }
    });
  };
}
