import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { api } from "@convex/_generated/api";
import { ExtractionGuide } from "@/components/extraction-guide";
import { hasRequiredRunCredentials } from "@/lib/credential-readiness";
import { getConvexClient } from "@/lib/convex-server";

export async function ExtractionOnboarding() {
  const { accessToken, user } = await withAuth();
  if (!user || !accessToken) redirect("/sign-in");

  const keys = await getConvexClient(accessToken).query(
    api.userCredentials.listForUser,
    {},
  );

  return <ExtractionGuide credentialsReady={hasRequiredRunCredentials(keys)} />;
}
