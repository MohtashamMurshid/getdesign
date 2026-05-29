/**
 * Pure credential resolution logic shared by the design API route.
 *
 * Lives in its own module (no `server-only`, no I/O) so the priority rules can
 * be unit tested without a WorkOS account or a running server.
 */

export type ResolvedCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

/** Where a resolved key came from, in priority order. */
export type CredentialSource = "request" | "vault" | "env";

export type CredentialSources = {
  /** Request-scoped BYOK keys sent in the API body. Highest priority. */
  request?: ResolvedCredentials;
  /** Per-user keys read from WorkOS Vault. Used when the user is signed in. */
  vault?: ResolvedCredentials;
  /** Process environment keys. Local-development fallback, lowest priority. */
  env?: ResolvedCredentials;
};

export type CredentialResolution = {
  credentials: ResolvedCredentials;
  origin: {
    daytonaApiKey?: CredentialSource;
    openaiApiKey?: CredentialSource;
  };
  /** Keys that could not be resolved from any source. */
  missing: Array<"daytonaApiKey" | "openaiApiKey">;
};

function clean(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolve each credential by priority: request (BYOK) > vault (per-user) > env.
 *
 * Each key is resolved independently, so a user can, for example, store their
 * OpenAI key in Vault while overriding the Daytona key for a single run.
 */
export function resolveCredentials(
  sources: CredentialSources,
): CredentialResolution {
  const order: Array<[CredentialSource, ResolvedCredentials | undefined]> = [
    ["request", sources.request],
    ["vault", sources.vault],
    ["env", sources.env],
  ];

  const credentials: ResolvedCredentials = {};
  const origin: CredentialResolution["origin"] = {};

  for (const field of ["daytonaApiKey", "openaiApiKey"] as const) {
    for (const [source, values] of order) {
      const value = clean(values?.[field]);
      if (value) {
        credentials[field] = value;
        origin[field] = source;
        break;
      }
    }
  }

  const missing = (["daytonaApiKey", "openaiApiKey"] as const).filter(
    (field) => !credentials[field],
  );

  return { credentials, origin, missing };
}
