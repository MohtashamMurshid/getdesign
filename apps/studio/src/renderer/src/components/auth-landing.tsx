import {
  IconCheck,
  IconChevronRight,
  IconExternalLink,
  IconKey,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Logo } from "./logo";

import type { StudioAuthStatus } from "../../../shared/studio-api";
import type { OauthCard } from "../studio/oauth-cards";

type ProviderOption = { value: string; label: string };

export function AuthLanding({
  error,
  oauthProviderCards,
  authStatus,
  manualCode,
  setManualCode,
  onSubmitLoginCode,
  onStartLogin,
  provider,
  setProvider,
  providers,
  apiKey,
  setApiKey,
  onRuntimeKey,
  onRefresh,
}: {
  error?: string;
  oauthProviderCards: OauthCard[];
  authStatus: StudioAuthStatus | undefined;
  manualCode: string;
  setManualCode: (value: string) => void;
  onSubmitLoginCode: () => void;
  onStartLogin: (providerId: string) => void;
  provider: string;
  setProvider: (value: string) => void;
  providers: ProviderOption[];
  apiKey: string;
  setApiKey: (value: string) => void;
  onRuntimeKey: () => void;
  onRefresh: () => void;
}) {
  return (
    <main className="min-h-full overflow-y-auto bg-background text-foreground">
      <section className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo size="lg" />
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <IconRefresh size={15} />
            Refresh
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-foreground" />
              Local-first design agent
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-5xl font-semibold tracking-tight lg:text-6xl">
                Sign in to your model layer.
              </h1>
              <p className="max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
                Studio uses Pi for provider auth, model discovery, and the
                agent session. Login once, then pick the exact models you want
                visible in the workspace.
              </p>
            </div>
            {error ? (
              <Card className="border-destructive/40 bg-destructive/10">
                <CardContent className="py-3 text-sm text-destructive">
                  {error}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="border-border/80 bg-card/80 shadow-2xl shadow-black/5">
            <CardHeader>
              <CardTitle>Connect with Pi</CardTitle>
              <CardDescription>
                Choose a provider login. Studio opens the auth page and keeps
                tokens inside Pi auth storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {oauthProviderCards.length > 0 ? (
                  oauthProviderCards.map((oauthProvider) => (
                    <button
                      key={oauthProvider.id}
                      type="button"
                      onClick={() => onStartLogin(oauthProvider.id)}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-background/60 p-4 text-left transition-colors hover:bg-muted"
                    >
                      <span>
                        <span className="block font-medium">
                          {oauthProvider.name}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {oauthProvider.description}
                        </span>
                      </span>
                      <IconChevronRight
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        size={18}
                      />
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    No Pi OAuth providers were found. Refresh, or use a BYOK
                    key below.
                  </div>
                )}
              </div>

              {authStatus?.login && authStatus.login.status !== "idle" ? (
                <LoginStateCard
                  authStatus={authStatus}
                  manualCode={manualCode}
                  setManualCode={setManualCode}
                  onSubmitLoginCode={onSubmitLoginCode}
                />
              ) : null}

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Or use BYOK for this session
                </p>
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
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
                  Continue with runtime key
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={window.api.openPiAuthDocs}
              >
                <IconExternalLink size={15} />
                Open Pi auth docs
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function LoginStateCard({
  authStatus,
  manualCode,
  setManualCode,
  onSubmitLoginCode,
}: {
  authStatus: StudioAuthStatus;
  manualCode: string;
  setManualCode: (value: string) => void;
  onSubmitLoginCode: () => void;
}) {
  if (!authStatus.login || authStatus.login.status === "idle") return null;

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-sm">
          {authStatus.login.providerName ?? authStatus.login.providerId} login:{" "}
          {authStatus.login.status}
        </CardTitle>
        {authStatus.login.instructions ? (
          <CardDescription>{authStatus.login.instructions}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {authStatus.login.authUrl ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => window.open(authStatus.login?.authUrl, "_blank")}
          >
            Reopen login page
          </Button>
        ) : null}
        {authStatus.login.progress?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {authStatus.login.progress.slice(-4).map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
        {authStatus.login.needsManualCode ? (
          <div className="space-y-2">
            <Label htmlFor="manual-code">
              {authStatus.login.promptMessage ?? "Manual login code"}
            </Label>
            <Input
              id="manual-code"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Paste redirect URL or code"
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={onSubmitLoginCode}
              disabled={!manualCode.trim()}
            >
              Submit login code
            </Button>
          </div>
        ) : null}
        {authStatus.login.status === "completed" ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconCheck size={14} />
            Login completed. Loading models...
          </p>
        ) : null}
        {authStatus.login.error ? (
          <p className="text-xs text-destructive">{authStatus.login.error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
