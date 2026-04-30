import {
  IconCheck,
  IconExternalLink,
  IconKey,
  IconLogout,
} from "@tabler/icons-react";

import type { StudioCursorAuthStatus } from "../../../../shared/studio-api";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";

export type CursorAccountCardProps = {
  cursorAuth: StudioCursorAuthStatus;
  apiKeyDraft: string;
  setApiKeyDraft: (value: string) => void;
  busy: boolean;
  error?: string;
  onLogin: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
};

export function CursorAccountCard({
  cursorAuth,
  apiKeyDraft,
  setApiKeyDraft,
  busy,
  error,
  onLogin,
  onLogout,
  onOpenDashboard,
}: CursorAccountCardProps) {
  const account = cursorAuth.account;
  const displayName =
    account?.userFirstName || account?.userLastName
      ? [account?.userFirstName, account?.userLastName]
          .filter(Boolean)
          .join(" ")
      : undefined;

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-normal tracking-tight">
          Cursor account
        </CardTitle>
        <CardDescription className="font-light leading-relaxed">
          Connect Studio to your Cursor account using a personal API key from{" "}
          <button
            type="button"
            onClick={onOpenDashboard}
            className="text-foreground underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            cursor.com/dashboard/integrations
          </button>
          . The key is encrypted on this device and used to authorize Cursor
          SDK runs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {cursorAuth.signedIn && account ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <IconCheck size={14} className="text-foreground/70" />
                <span className="text-sm font-normal">
                  Signed in
                  {displayName ? ` as ${displayName}` : ""}
                </span>
              </div>
              <dl className="mt-2 grid gap-1 text-xs font-light text-muted-foreground">
                {account.userEmail ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>Email</dt>
                    <dd className="truncate font-mono text-[11px]">
                      {account.userEmail}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <dt>API key</dt>
                  <dd className="truncate font-mono text-[11px]">
                    {cursorAuth.apiKeyHint ?? account.apiKeyName}
                  </dd>
                </div>
                {account.apiKeyName ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>Key name</dt>
                    <dd className="truncate text-[11px]">
                      {account.apiKeyName}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onLogout}
                disabled={busy}
              >
                <IconLogout size={14} />
                Sign out of Cursor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDashboard}
                disabled={busy}
              >
                <IconExternalLink size={14} />
                Manage keys on cursor.com
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="password"
              value={apiKeyDraft}
              onChange={(event) => setApiKeyDraft(event.target.value)}
              placeholder="cursor_..."
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="sm"
                onClick={onLogin}
                disabled={!apiKeyDraft.trim() || busy}
              >
                <IconKey size={14} />
                {busy ? "Verifying..." : "Sign in with Cursor"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenDashboard}
                disabled={busy}
              >
                <IconExternalLink size={14} />
                Get an API key
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
