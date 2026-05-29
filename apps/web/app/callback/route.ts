import type { NextRequest } from "next/server";

import { isWorkOSConfigured } from "../_lib/workos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AuthKit redirect callback. Exchanges the authorization code for a session and
 * returns the user to the dashboard. Disabled in local mode (no WorkOS config).
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!isWorkOSConfigured()) {
    return new Response("WorkOS authentication is not configured.", {
      status: 404,
    });
  }

  const { handleAuth } = await import("@workos-inc/authkit-nextjs");
  return handleAuth({ returnPathname: "/dashboard" })(request);
}
