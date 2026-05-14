import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { AgentCommand } from "./agent-command";

export default function AgentPage() {
  const aiReady = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY);
  const daytonaReady = Boolean(process.env.DAYTONA_API_KEY);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Agent</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <AgentCommand aiReady={aiReady} daytonaReady={daytonaReady} />
    </>
  );
}
