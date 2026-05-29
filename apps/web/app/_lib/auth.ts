import "server-only";

import { isWorkOSConfigured } from "./workos";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

/**
 * Resolve the signed-in WorkOS user for the current request, or `null` when no
 * session exists or WorkOS is not configured (local mode).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isWorkOSConfigured()) return null;

  const { withAuth } = await import("@workos-inc/authkit-nextjs");
  const { user } = await withAuth();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
  };
}
