import type { AuthConfig } from "convex/server";

import { workosAuthProviders } from "./workosAuth";

const clientId = process.env.WORKOS_CLIENT_ID?.trim();

if (!clientId) {
  throw new Error("WORKOS_CLIENT_ID is required for Convex authentication.");
}

export default {
  providers: workosAuthProviders(clientId),
} satisfies AuthConfig;
