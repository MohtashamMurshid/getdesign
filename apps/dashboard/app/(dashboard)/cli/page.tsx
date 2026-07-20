import { buildCliCommand, docsUrl } from "@getdesign/content";

import {
  CopyCommand,
  CredentialCallout,
  DocsLinkCard,
  SurfaceDemo,
  SurfacePageShell,
} from "@/components/developer";

const EXAMPLE_SITE = "https://cursor.com";

export default function CliPage() {
  return (
    <SurfacePageShell
      title="CLI"
      description="Generate a Cursor-ready design.md from your terminal with bunx @getdesign/cli."
      demo={<SurfaceDemo surface="cli" />}
    >
      <CredentialCallout variant="cli" />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Install / run</h2>
        <CopyCommand
          label="Bun (recommended)"
          command={buildCliCommand(EXAMPLE_SITE)}
        />
        <CopyCommand
          label="npx"
          command={`npx @getdesign/cli ${EXAMPLE_SITE}`}
        />
        <p className="text-xs text-muted-foreground">
          The binary targets Bun. Install Bun first if{" "}
          <code className="font-mono">bunx</code> is unavailable.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Output</h2>
        <p className="text-sm text-muted-foreground">
          Without{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            --out
          </code>
          , the CLI writes to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            ./getdesign-runs/&lt;slug&gt;/design.md
          </code>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Common flags</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <code className="font-mono text-xs text-foreground">--out &lt;path&gt;</code>{" "}
            — write markdown to a file or directory
          </li>
          <li>
            <code className="font-mono text-xs text-foreground">
              --site-name &lt;name&gt;
            </code>{" "}
            — override detected site name
          </li>
          <li>
            <code className="font-mono text-xs text-foreground">
              --text-only-fallback
            </code>{" "}
            — continue with CSS/text-only if capture fails
          </li>
          <li>
            <code className="font-mono text-xs text-foreground">
              --daytona-api-key
            </code>{" "}
            /{" "}
            <code className="font-mono text-xs text-foreground">
              --openai-api-key
            </code>{" "}
            — or set{" "}
            <code className="font-mono text-xs text-foreground">
              DAYTONA_API_KEY
            </code>{" "}
            /{" "}
            <code className="font-mono text-xs text-foreground">
              OPENAI_API_KEY
            </code>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Docs</h2>
        <div className="grid gap-2">
          <DocsLinkCard
            href={docsUrl("/surfaces/cli")}
            title="CLI surface"
            description="Usage overview and examples"
          />
          <DocsLinkCard
            href={docsUrl("/reference/cli")}
            title="CLI reference"
            description="Generated from --help"
          />
        </div>
      </section>
    </SurfacePageShell>
  );
}
