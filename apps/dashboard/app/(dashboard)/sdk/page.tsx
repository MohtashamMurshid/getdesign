import { buildSdkInstall, docsUrl } from "@getdesign/content";

import {
  CopyCommand,
  CredentialCallout,
  DocsLinkCard,
  SurfaceDemo,
  SurfacePageShell,
} from "@/components/developer";
import { SdkSnippetTabs } from "@/components/developer/sdk-snippet-tabs";

export default function SdkPage() {
  return (
    <SurfacePageShell
      title="SDK"
      description="Typed TypeScript client for Node/Bun. getDesign and streamDesign run the agent in-process with your credentials."
      demo={<SurfaceDemo surface="sdk" />}
    >
      <CredentialCallout variant="sdk" />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Install</h2>
        <CopyCommand label="package" command={buildSdkInstall()} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Quick example</h2>
        <SdkSnippetTabs />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Credentials</h2>
        <p className="text-sm text-muted-foreground">
          Pass{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {"credentials: { daytonaApiKey, openaiApiKey }"}
          </code>{" "}
          or set the same env vars the CLI uses. The SDK does not call the
          hosted HTTP API today — it runs{" "}
          <code className="font-mono text-xs">@getdesign/agent</code>{" "}
          in-process.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Runtime</h2>
        <p className="text-sm text-muted-foreground">
          Bun/server environments with enough time for browser capture and LLM
          synthesis. Not a browser or edge-runtime client.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Docs</h2>
        <div className="grid gap-2">
          <DocsLinkCard
            href={docsUrl("/surfaces/sdk")}
            title="SDK surface"
            description="Install, getDesign, and streamDesign"
          />
          <DocsLinkCard
            href={docsUrl("/guides/sdk-in-next")}
            title="SDK in Next.js"
            description="Route-handler pattern with streamDesign"
          />
          <DocsLinkCard
            href={docsUrl("/reference/sdk")}
            title="SDK reference"
            description="TypeDoc-generated API reference"
          />
        </div>
      </section>
    </SurfacePageShell>
  );
}
