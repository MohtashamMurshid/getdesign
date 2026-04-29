import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import type { StudioAddCustomModelInput } from "../../../../shared/studio-api";

export function AddCustomModelInline({
  providerId,
  onSubmit,
}: {
  providerId: string;
  onSubmit: (input: StudioAddCustomModelInput) => Promise<void>;
}) {
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!modelId.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        providerId,
        modelId: modelId.trim(),
        modelName: modelName.trim() || undefined,
      });
      setModelId("");
      setModelName("");
    } catch {
      /* error surfaces in parent */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label
          htmlFor={`add-model-id-${providerId}`}
          className="text-[11px] font-light uppercase tracking-[0.12em] text-muted-foreground"
        >
          Model id
        </Label>
        <Input
          id={`add-model-id-${providerId}`}
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          placeholder="llama3.1:8b"
          onKeyDown={(event) => {
            if (event.key === "Enter" && modelId.trim() && !busy) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label
          htmlFor={`add-model-name-${providerId}`}
          className="text-[11px] font-light uppercase tracking-[0.12em] text-muted-foreground"
        >
          Display name (optional)
        </Label>
        <Input
          id={`add-model-name-${providerId}`}
          value={modelName}
          onChange={(event) => setModelName(event.target.value)}
          placeholder="Llama 3.1 8B"
          onKeyDown={(event) => {
            if (event.key === "Enter" && modelId.trim() && !busy) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || !modelId.trim()}
        onClick={() => void handleSubmit()}
      >
        <IconPlus size={14} strokeWidth={1.6} />
        Add model
      </Button>
    </div>
  );
}
