import {
  buildCurlExample,
  docsUrl,
} from "@getdesign/content";

import {
  CopyCommand,
  CredentialCallout,
  DocsLinkCard,
  SurfaceDemo,
  SurfacePageShell,
} from "@/components/developer";

const EXAMPLE_SITE = "https://stripe.com";

export default function ApiPage() {
  return (
    <SurfacePageShell
      title="API"
      description="Turn any public URL into a design.md over HTTP. One endpoint, markdown out."
      demo={<SurfaceDemo surface="api" />}
    >
      <CredentialCallout variant="api" />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Quick start</h2>
        <CopyCommand
          label="curl"
          command={buildCurlExample(EXAMPLE_SITE)}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Endpoints</h2>
        <div className="overflow-hidden rounded-xl border text-sm">
          <EndpointRow
            method="GET"
            path="/?url=…"
            note="Markdown compatibility route"
          />
          <EndpointRow
            method="GET"
            path="/v1/design?url=…"
            note="Markdown, or JSON with format=json"
          />
          <EndpointRow
            method="GET"
            path="/v1/design/stream?url=…"
            note="SSE: progress, then result or error"
            last
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Query parameters</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              url
            </code>{" "}
            — required absolute HTTPS URL
          </li>
          <li>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              viewport
            </code>{" "}
            — optional, e.g.{" "}
            <code className="font-mono text-xs">1440x900</code>
          </li>
          <li>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              format=json
            </code>{" "}
            — structured result on{" "}
            <code className="font-mono text-xs">/v1/design</code>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Authentication</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>No getdesign API key in v1 — public calls need no Bearer token.</li>
          <li>
            Optional BYOK headers for full capture:{" "}
            <code className="font-mono text-xs text-foreground">
              x-daytona-api-key
            </code>
            ,{" "}
            <code className="font-mono text-xs text-foreground">
              x-openai-api-key
            </code>
            . Never put secrets in the query string.
          </li>
          <li>
            Optional:{" "}
            <code className="font-mono text-xs text-foreground">
              x-getdesign-mode: text_only
            </code>{" "}
            after a capture failure.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Docs</h2>
        <div className="grid gap-2">
          <DocsLinkCard
            href={docsUrl("/surfaces/api")}
            title="API surface"
            description="Endpoint contract, params, and response codes"
          />
          <DocsLinkCard
            href={docsUrl("/guides/call-the-api")}
            title="Call the API"
            description="Copy-paste curl walkthrough"
          />
          <DocsLinkCard
            href={docsUrl("/resources/faq")}
            title="FAQ"
            description="Rate limits, auth model, and common questions"
          />
        </div>
      </section>
    </SurfacePageShell>
  );
}

function EndpointRow({
  method,
  path,
  note,
  last = false,
}: {
  method: string;
  path: string;
  note: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-3 ${last ? "" : "border-b"}`}
    >
      <span className="shrink-0 font-mono text-xs font-medium text-foreground">
        {method}
      </span>
      <code className="min-w-0 break-all font-mono text-xs text-foreground">
        {path}
      </code>
      <span className="text-xs text-muted-foreground sm:ml-auto sm:text-right">
        {note}
      </span>
    </div>
  );
}
