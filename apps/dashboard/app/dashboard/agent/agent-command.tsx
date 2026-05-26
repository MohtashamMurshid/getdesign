"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { InputBar } from "@/components/agent-elements/input-bar";
import { BrandMark } from "@/components/brand-mark";
import { createDesignRunAction } from "./actions";

type AgentCommandProps = {
  aiReady: boolean;
};

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

export function AgentCommand({ aiReady }: AgentCommandProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-xl flex-col justify-center px-4 py-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark size={34} />
        <p className="mt-4 text-lg font-medium tracking-tight text-foreground">
          What are we designing today?
        </p>
      </div>

      <InputBar
        size="lg"
        className="px-0 pb-0"
        status={isPending ? "submitted" : "ready"}
        disabled={!aiReady}
        placeholder={aiReady ? "Enter a URL..." : "Add an AI key to start"}
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
          !aiReady
            ? {
                title: "Setup needed.",
                description: "Add an AI key in Settings.",
                action: {
                  label: "Settings",
                  onClick: () => router.push("/dashboard/account"),
                },
              }
            : undefined
        }
      />

      {error ? <p className="mt-2 text-center text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
