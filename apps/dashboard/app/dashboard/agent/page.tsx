import { withAuth } from "@workos-inc/authkit-nextjs";

import { AgentCommand } from "./agent-command";

export default async function AgentPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const aiReady = Boolean(process.env.OPENAI_API_KEY);

  return (
    <AgentCommand
      aiReady={aiReady}
      user={{ id: user.id, email: user.email ?? undefined }}
    />
  );
}
