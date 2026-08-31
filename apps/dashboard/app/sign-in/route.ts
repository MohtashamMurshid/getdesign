import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { readConfig, consentFromCookie } from "@getdesign/analytics/config";
import { signupFlowState } from "@getdesign/analytics/auth";

export const GET = async (request: Request) => {
  const config = readConfig(
    process.env.NEXT_PUBLIC_POSTHOG_CONFIG,
    new URL(request.url).origin,
  );
  const consented =
    !!config &&
    consentFromCookie(request.headers.get("cookie") ?? "", config) ===
      "granted" &&
    request.headers.get("sec-gpc") !== "1" &&
    request.headers.get("dnt") !== "1";
  const signInUrl = await getSignInUrl({ state: signupFlowState(consented) });
  redirect(signInUrl);
};
