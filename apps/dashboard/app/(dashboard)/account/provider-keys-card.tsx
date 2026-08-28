"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProviderKeyMeta = {
  provider: "daytona" | "openai";
  keySuffix: string;
  updatedAt: number;
};

type ProviderId = ProviderKeyMeta["provider"];

const PROVIDERS: Array<{
  id: ProviderId;
  label: string;
  placeholder: string;
}> = [
  { id: "daytona", label: "Daytona", placeholder: "Daytona API key" },
  { id: "openai", label: "OpenAI", placeholder: "OpenAI API key" },
];

function formatUpdatedAt(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProviderKeysCard({ keys }: { keys: ProviderKeyMeta[] }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium">Provider keys</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Dashboard runs use these keys. They are encrypted at rest and never
        shown again after you save.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {PROVIDERS.map((provider) => (
          <ProviderKeyRow
            key={provider.id}
            provider={provider}
            stored={keys.find((entry) => entry.provider === provider.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ProviderKeyRow({
  provider,
  stored,
}: {
  provider: (typeof PROVIDERS)[number];
  stored?: ProviderKeyMeta;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [replacing, setReplacing] = useState(false);
  const [optimistic, setOptimistic] = useState<ProviderKeyMeta | null>();
  const [pending, setPending] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptimistic(undefined);
  }, [stored?.keySuffix, stored?.updatedAt]);

  const current = optimistic === undefined ? stored : optimistic ?? undefined;
  const showForm = !current || replacing;

  async function save() {
    setError(null);
    setPending("save");
    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, key: draft }),
      });
      const payload = (await response.json()) as {
        error?: string;
        keySuffix?: string;
      };
      if (!response.ok || !payload.keySuffix) {
        setError(payload.error ?? "Could not save key.");
        return;
      }
      setDraft("");
      setReplacing(false);
      setOptimistic({
        provider: provider.id,
        keySuffix: payload.keySuffix,
        updatedAt: Date.now(),
      });
      router.refresh();
    } catch {
      setError("Could not save key.");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    setError(null);
    setPending("remove");
    try {
      const response = await fetch("/api/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not remove key.");
        return;
      }
      setDraft("");
      setReplacing(false);
      setOptimistic(null);
      router.refresh();
    } catch {
      setError("Could not remove key.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">{provider.label}</p>
      {showForm ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            placeholder={provider.placeholder}
            disabled={pending !== null}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDraft(event.target.value)
            }
            className="max-w-sm"
          />
          <Button
            size="sm"
            disabled={pending !== null || !draft.trim()}
            onClick={() => void save()}
          >
            {pending === "save" ? "Saving" : "Save"}
          </Button>
          {current ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending !== null}
              onClick={() => {
                setDraft("");
                setReplacing(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs">••••{current.keySuffix}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Updated {formatUpdatedAt(current.updatedAt)}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => {
                setDraft("");
                setReplacing(true);
                setError(null);
              }}
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending !== null}
              onClick={() => void remove()}
            >
              {pending === "remove" ? "Removing" : "Remove"}
            </Button>
          </div>
        </div>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
