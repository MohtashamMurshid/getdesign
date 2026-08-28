import Link from "next/link";

import { docsUrl } from "@getdesign/content";

import { cn } from "@/lib/utils";

type CredentialCalloutProps = {
  variant?: "api" | "cli" | "sdk";
  className?: string;
};

const COPY: Record<
  NonNullable<CredentialCalloutProps["variant"]>,
  { title: string; body: string }
> = {
  api: {
    title: "No getdesign API key",
    body: "Send Authorization: Bearer <WorkOS access token> plus x-daytona-api-key and x-openai-api-key. Never put secrets in the query string.",
  },
  cli: {
    title: "Bring your own keys",
    body: "The CLI runs the agent on your machine. Set DAYTONA_API_KEY and OPENAI_API_KEY (or pass --daytona-api-key / --openai-api-key).",
  },
  sdk: {
    title: "Bring your own keys",
    body: "The SDK runs in-process today. Pass credentials: { daytonaApiKey, openaiApiKey } (or rely on the same env vars as the CLI).",
  },
};

export function CredentialCallout({
  variant = "api",
  className,
}: CredentialCalloutProps) {
  const content = COPY[variant];

  return (
    <aside
      className={cn(
        "rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{content.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{content.body}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Details in{" "}
        <Link
          href={docsUrl("/resources/faq")}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          the FAQ
        </Link>
        .
      </p>
    </aside>
  );
}
