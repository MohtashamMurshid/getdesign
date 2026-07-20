import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { AgentCommand } from "./agent-command";

export default async function AgentPage() {
  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  const aiReady = Boolean(process.env.OPENAI_API_KEY);

  return (
    <AgentCommand
      aiReady={aiReady}
      user={{ id: user.id, email: user.email ?? undefined }}
    />
  );
}
