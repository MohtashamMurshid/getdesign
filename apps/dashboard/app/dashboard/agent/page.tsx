import { AgentCommand } from "./agent-command";

export default function AgentPage() {
  const aiReady = Boolean(process.env.OPENAI_API_KEY);

  return <AgentCommand aiReady={aiReady} />;
}
