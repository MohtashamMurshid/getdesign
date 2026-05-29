import { redirect } from "next/navigation";

import { isWorkOSConfigured } from "../_lib/workos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Kicks off the AuthKit hosted sign-in flow. `screenHint=sign-up` opens the
 * sign-up screen instead. Falls back to the dashboard in local mode.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isWorkOSConfigured()) {
    redirect("/dashboard");
  }

  const wantsSignUp = new URL(request.url).searchParams.get("screen") === "sign-up";
  const { getSignInUrl, getSignUpUrl } = await import(
    "@workos-inc/authkit-nextjs"
  );
  const url = wantsSignUp ? await getSignUpUrl() : await getSignInUrl();
  redirect(url);
}
