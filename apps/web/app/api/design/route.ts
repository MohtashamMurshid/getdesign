import { streamDesign, type DesignStreamEvent } from "@getdesign/sdk";

import { getCurrentUser } from "../../_lib/auth";
import { getUserCredentials } from "../../_lib/credentials";
import {
  resolveCredentials,
  type ResolvedCredentials,
} from "../../_lib/credentials-resolver";
import { isWorkOSConfigured } from "../../_lib/workos";

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

function envCredentials(): ResolvedCredentials {
  return {
    daytonaApiKey: process.env.DAYTONA_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  };
}

/**
 * Resolve the keys for a run by priority: request body (BYOK) > the signed-in
 * user's WorkOS Vault secrets > local environment variables.
 */
async function resolveRunCredentials(request: ResolvedCredentials) {
  let vault: ResolvedCredentials | undefined;

  if (isWorkOSConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        vault = await getUserCredentials(user.id);
      }
    } catch {
      // Treat Vault/auth failures as "no stored credentials" and fall through
      // to env-var resolution; the run still fails cleanly if nothing resolves.
    }
  }

  return resolveCredentials({
    request,
    vault,
    env: envCredentials(),
  });
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

  const credentials = await resolveRunCredentials({
    daytonaApiKey: stringField(body.daytonaApiKey),
    openaiApiKey: stringField(body.openaiApiKey),
  });

  if (credentials.missing.length > 0) {
    return jsonError(
      400,
      "missing_credentials",
      "No Daytona and OpenAI keys found. Enter them below, save them in Settings, or set DAYTONA_API_KEY / OPENAI_API_KEY locally.",
    );
  }

  const { daytonaApiKey, openaiApiKey } = credentials.credentials;

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
