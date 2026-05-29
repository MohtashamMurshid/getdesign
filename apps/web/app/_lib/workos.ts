/**
 * WorkOS configuration detection.
 *
 * Kept dependency-free (no SDK import, no `server-only`) so it can run in the
 * Next.js proxy/edge runtime and be imported anywhere. The actual WorkOS client
 * and Vault access live in `credentials.ts`, which is server-only.
 *
 * When WorkOS is not configured the app degrades gracefully to "local mode":
 * authentication is skipped and the dashboard relies on request-scoped BYOK
 * keys or `DAYTONA_API_KEY` / `OPENAI_API_KEY` environment variables.
 */
export function isWorkOSConfigured(): boolean {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_COOKIE_PASSWORD,
  );
}
