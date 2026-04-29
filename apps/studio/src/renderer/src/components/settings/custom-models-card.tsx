import { useState } from "react";
import { IconCpu, IconExternalLink } from "@tabler/icons-react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import type {
  StudioCustomProviderApi,
  StudioAddCustomProviderInput,
} from "../../../../shared/studio-api";

export function CustomModelsCard({
  customProviderApiOptions,
  onAddCustomProvider,
}: {
  customProviderApiOptions: { value: StudioCustomProviderApi; label: string }[];
  onAddCustomProvider: (
    input: StudioAddCustomProviderInput,
  ) => Promise<void>;
}) {
  const [cpId, setCpId] = useState("");
  const [cpBaseUrl, setCpBaseUrl] = useState("http://localhost:11434/v1");
  const [cpApi, setCpApi] =
    useState<StudioCustomProviderApi>("openai-completions");
  const [cpApiKey, setCpApiKey] = useState("ollama");
  const [cpModelId, setCpModelId] = useState("");
  const [cpModelName, setCpModelName] = useState("");
  const [customFormBusy, setCustomFormBusy] = useState(false);

  async function submitCustomProvider() {
    setCustomFormBusy(true);
    try {
      await onAddCustomProvider({
        providerId: cpId.trim(),
        baseUrl: cpBaseUrl.trim(),
        api: cpApi,
        apiKey: cpApiKey.trim(),
        modelId: cpModelId.trim(),
        modelName: cpModelName.trim() || undefined,
      });
      setCpModelId("");
      setCpModelName("");
    } catch {
      /* error set in parent */
    } finally {
      setCustomFormBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Custom models</CardTitle>
        <CardDescription>
          Add local or proxy providers (Ollama, LM Studio, vLLM, etc.) to
          your Pi{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            models.json
          </code>
          . Reuses the same format as{" "}
          <button
            type="button"
            className="text-foreground underline decoration-muted-foreground underline-offset-2 hover:decoration-foreground"
            onClick={() => void window.api.openPiModelsDocs()}
          >
            Pi custom models docs
          </button>
          . Using the same provider id again adds another model to that
          block.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-normal">
            <IconCpu
              size={14}
              strokeWidth={1.6}
              className="text-muted-foreground"
            />
            Add provider &amp; model
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cp-id">Provider id</Label>
              <Input
                id="cp-id"
                value={cpId}
                onChange={(e) => setCpId(e.target.value)}
                placeholder="ollama"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cp-base">Base URL</Label>
              <Input
                id="cp-base"
                value={cpBaseUrl}
                onChange={(e) => setCpBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>API type</Label>
              <Select
                value={cpApi}
                onValueChange={(v) => setCpApi(v as StudioCustomProviderApi)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customProviderApiOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-key">API key</Label>
              <Input
                id="cp-key"
                value={cpApiKey}
                onChange={(e) => setCpApiKey(e.target.value)}
                placeholder="ollama or sk-..."
                type="password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-mid">Model id</Label>
              <Input
                id="cp-mid"
                value={cpModelId}
                onChange={(e) => setCpModelId(e.target.value)}
                placeholder="llama3.1:8b"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-mname">Display name (optional)</Label>
              <Input
                id="cp-mname"
                value={cpModelName}
                onChange={(e) => setCpModelName(e.target.value)}
                placeholder="Llama 3.1 8B local"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={
              customFormBusy ||
              !cpId.trim() ||
              !cpBaseUrl.trim() ||
              !cpApiKey.trim() ||
              !cpModelId.trim()
            }
            onClick={() => void submitCustomProvider()}
          >
            Add to models.json
          </Button>
        </div>

        <p className="text-xs font-light text-muted-foreground">
          Added entries appear under{" "}
          <span className="text-foreground/70">Connected providers</span>{" "}
          above, where you can toggle visibility or remove individual
          models.
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => void window.api.openPiModelsDocs()}
        >
          <IconExternalLink size={14} />
          Open Pi custom models docs
        </Button>
      </CardContent>
    </Card>
  );
}
