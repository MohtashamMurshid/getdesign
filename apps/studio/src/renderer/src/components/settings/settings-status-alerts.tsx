import { Card, CardContent } from "../ui/card";

import type { StudioAuthStatus } from "../../../../shared/studio-api";

export function SettingsStatusAlerts({
  error,
  authStatus,
}: {
  error?: string;
  authStatus: StudioAuthStatus | undefined;
}) {
  return (
    <>
      {error ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {authStatus?.modelsJsonSyntaxError ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-3 text-sm text-destructive">
            Could not parse models.json: {authStatus.modelsJsonSyntaxError}
          </CardContent>
        </Card>
      ) : null}

      {authStatus?.modelsRegistryError ? (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-3 text-sm text-amber-950 dark:text-amber-100">
            Pi rejected models.json: {authStatus.modelsRegistryError}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
