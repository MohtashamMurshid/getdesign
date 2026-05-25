import { streamDesign, type DesignStreamEvent } from "@getdesign/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type DesignRequestBody = {
  url?: unknown;
  siteName?: unknown;
  daytonaApiKey?: unknown;
  openaiApiKey?: unknown;
  visualRequirement?: unknown;
};

function stringField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function jsonError(status: number, error: string, reason?: string): Response {
  return new Response(JSON.stringify({ error, reason }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function encodeLine(event: DesignStreamEvent, encoder: TextEncoder): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  let body: DesignRequestBody;
  try {
    body = (await request.json()) as DesignRequestBody;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be JSON.");
  }

  const url = stringField(body.url);
  if (!url || !isAbsoluteUrl(url)) {
    return jsonError(
      400,
      "invalid_url",
      "Provide an absolute http(s) URL in `url`.",
    );
  }

  const daytonaApiKey = stringField(body.daytonaApiKey);
  const openaiApiKey = stringField(body.openaiApiKey);
  if (!daytonaApiKey || !openaiApiKey) {
    return jsonError(
      400,
      "missing_credentials",
      "Provide your own Daytona and OpenAI API keys to run a design.",
    );
  }

  const siteName = stringField(body.siteName);
  const visualRequirement =
    stringField(body.visualRequirement) === "text_only_fallback"
      ? "text_only_fallback"
      : "require";

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (event: DesignStreamEvent) => {
        try {
          controller.enqueue(encodeLine(event, encoder));
        } catch {
          // Client disconnected; nothing to do.
        }
      };

      try {
        for await (const event of streamDesign(url, {
          siteName,
          credentials: { daytonaApiKey, openaiApiKey },
          visualRequirement,
        })) {
          safeEnqueue(event);
        }
      } catch (err) {
        safeEnqueue({
          type: "error",
          error: {
            error: "internal_error",
            reason:
              err instanceof Error
                ? err.message
                : "Unknown error while running design.",
          },
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
