"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { InputBar } from "@/components/agent-elements/input-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createDesignRunAction } from "./actions";

type AgentCommandProps = {
  aiReady: boolean;
  daytonaReady: boolean;
};

const EXAMPLES = ["stripe.com", "linear.app", "vercel.com", "notion.so"];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isProbablyUrl(value: string) {
  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function AgentCommand({ aiReady, daytonaReady }: AgentCommandProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const suggestions = useMemo(
    () =>
      EXAMPLES.map((site) => ({
        label: site,
        value: site,
      })),
    [],
  );

  const ready = aiReady;

  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-3xl flex-col justify-center px-4 py-10">
      <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Crawl</span>
        <span className="h-px w-5 bg-border" />
        <span>Capture</span>
        <span className="h-px w-5 bg-border" />
        <span>Extract</span>
        <span className="h-px w-5 bg-border" />
        <span>Synthesize</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <InputBar
        status={isPending ? "submitted" : "ready"}
        disabled={!ready}
        placeholder={ready ? "Analyze a public URL..." : "Add an AI key to start"}
        suggestions={ready ? suggestions : []}
        onStop={() => {}}
        onSend={({ content }) => {
          setError(null);
          if (!isProbablyUrl(content)) {
            setError("Enter a public URL.");
            return;
          }

          startTransition(async () => {
            try {
              const run = await createDesignRunAction(normalizeUrl(content));
              router.push(`/dashboard/runs/${run.id}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not start run.");
            }
          });
        }}
        infoBar={
          !ready
            ? {
                title: "Setup needed.",
                description: "Add an AI Gateway or OpenAI key in Settings.",
                action: {
                  label: "Settings",
                  onClick: () => router.push("/dashboard/account"),
                },
              }
            : !daytonaReady
              ? {
                  title: "Text-only fallback available.",
                  description: "Add Daytona for visual capture.",
                  action: {
                    label: "Settings",
                    onClick: () => router.push("/dashboard/account"),
                  },
                }
              : undefined
        }
      />

      {error ? <p className="mt-3 text-center text-xs text-destructive">{error}</p> : null}

      <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <SetupRow ready={aiReady} label="AI key" required />
        <SetupRow ready={daytonaReady} label="Visual capture" />
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          View recent runs
        </Button>
      </div>
    </div>
  );
}

function SetupRow({
  ready,
  label,
  required,
}: {
  ready: boolean;
  label: string;
  required?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b py-2",
        ready ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <span>{label}</span>
      <span className="flex items-center gap-1.5">
        <HugeiconsIcon
          icon={ready ? CheckmarkCircle02Icon : Alert02Icon}
          className={cn("size-3.5", ready ? "text-muted-foreground" : "text-destructive")}
          strokeWidth={1.75}
        />
        {ready ? "Ready" : required ? "Required" : "Recommended"}
      </span>
    </div>
  );
}
