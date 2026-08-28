import { ConvexError } from "convex/values";

type AuthContext = {
  auth: {
    getUserIdentity(): Promise<{
      subject: string;
    } | null>;
  };
};

export async function requireWorkOsUserId(
  ctx: AuthContext,
  expectedClientId = process.env.WORKOS_CLIENT_ID?.trim(),
): Promise<string> {
  if (!expectedClientId) {
    throw new ConvexError("WORKOS_CLIENT_ID is unset");
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  return identity.subject;
}
