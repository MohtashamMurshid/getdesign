import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { api } from "@convex/_generated/api";
import { hasRequiredRunCredentials } from "@/lib/credential-readiness";
import { getConvexClient } from "@/lib/convex-server";

import { AgentCommand } from "./agent-command";

export default async function AgentPage() {
  const { accessToken, user } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  const keys = await getConvexClient(accessToken).query(
    api.userCredentials.listForUser,
    {},
  );
  const credentialsReady = hasRequiredRunCredentials(keys);

  return (
    <AgentCommand
      credentialsReady={credentialsReady}
      user={{ id: user.id, email: user.email ?? undefined }}
    />
  );
}
