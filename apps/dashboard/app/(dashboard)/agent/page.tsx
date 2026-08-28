import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { api } from "@convex/_generated/api";
import { getConvexClient } from "@/lib/convex-server";

import { AgentCommand } from "./agent-command";

export default async function AgentPage() {
  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  const keys = await getConvexClient().query(api.userCredentials.listForUser, {
    userId: user.id,
  });
  const aiReady = keys.some((key) => key.provider === "openai");

  return (
    <AgentCommand
      aiReady={aiReady}
      user={{ id: user.id, email: user.email ?? undefined }}
    />
  );
}
