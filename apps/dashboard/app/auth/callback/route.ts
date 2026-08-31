import { handleAuth } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import { captureCompletedSignup } from "@getdesign/analytics/auth";

export async function GET(request: NextRequest) {
  return handleAuth({
    returnPathname: "/",
    onSuccess: async ({ user, state, impersonator }) => {
      if (!impersonator)
        await captureCompletedSignup(
          request,
          process.env.NEXT_PUBLIC_POSTHOG_CONFIG,
          state,
          user,
        );
    },
  })(request);
}
