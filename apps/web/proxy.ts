import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

import { isWorkOSConfigured } from "./app/_lib/workos";

/**
 * AuthKit session management runs on every matched route, but authentication is
 * enforced per-page via `withAuth({ ensureSignedIn })` rather than globally —
 * the marketing site and the BYOK dashboard stay public.
 *
 * When WorkOS is not configured (local development without credentials), the
 * proxy is a pass-through so the app keeps working with env-var keys.
 */
const proxy = isWorkOSConfigured()
  ? authkitMiddleware()
  : () => NextResponse.next();

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
