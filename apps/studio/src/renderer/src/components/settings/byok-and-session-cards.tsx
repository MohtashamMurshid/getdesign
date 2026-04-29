import { IconExternalLink, IconKey, IconLogout } from "@tabler/icons-react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import type { ProviderOption } from "./settings-types";

export function ByokCard({
  provider,
  setProvider,
  providers,
  apiKey,
  setApiKey,
  onRuntimeKey,
}: {
  provider: string;
  setProvider: (value: string) => void;
  providers: ProviderOption[];
  apiKey: string;
  setApiKey: (value: string) => void;
  onRuntimeKey: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bring your own key</CardTitle>
        <CardDescription>
          Use a runtime API key for this session. Not persisted to disk.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Paste API key"
          />
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={onRuntimeKey}
          disabled={!apiKey.trim()}
        >
          <IconKey size={16} />
          Save runtime key
        </Button>
      </CardContent>
    </Card>
  );
}

export function SessionCard({
  onLogoutAll,
  onPreviewAuth,
}: {
  onLogoutAll: () => void;
  onPreviewAuth: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session</CardTitle>
        <CardDescription>
          Sign out of every connected provider. This clears OAuth tokens
          and runtime API keys from Pi&apos;s auth storage and returns you
          to the welcome screen.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onLogoutAll}
        >
          <IconLogout size={15} />
          Sign out of everything
        </Button>
        {import.meta.env.DEV ? (
          <Button variant="ghost" size="sm" onClick={onPreviewAuth}>
            Preview login screen
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={window.api.openPiAuthDocs}>
          <IconExternalLink size={14} />
          Pi auth reference
        </Button>
      </CardContent>
    </Card>
  );
}
