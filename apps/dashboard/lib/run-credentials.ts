import { api } from "@convex/_generated/api";

import { decryptCredential } from "@/lib/credential-crypto";
import type { getConvexClient } from "@/lib/convex-server";

export type RunCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

export async function resolveRunCredentials(
  convex: ReturnType<typeof getConvexClient>,
): Promise<RunCredentials> {
  const [daytona, openai] = await Promise.all([
    convex.query(api.userCredentials.getEncrypted, {
      provider: "daytona",
    }),
    convex.query(api.userCredentials.getEncrypted, {
      provider: "openai",
    }),
  ]);

  const credentials: RunCredentials = {};

  if (daytona) {
    credentials.daytonaApiKey = await decryptCredential(
      daytona.ciphertext,
      daytona.iv,
    );
  }

  if (openai) {
    credentials.openaiApiKey = await decryptCredential(
      openai.ciphertext,
      openai.iv,
    );
  }

  return credentials;
}

export function requireDaytonaCredential(credentials: RunCredentials): string {
  if (!credentials.daytonaApiKey) {
    throw new Error(
      "No Daytona API key stored. Add one on Account before capture can run.",
    );
  }
  return credentials.daytonaApiKey;
}

export function requireOpenAiCredential(credentials: RunCredentials): string {
  if (!credentials.openaiApiKey) {
    throw new Error(
      "No OpenAI API key stored. Add one on Account before describe or synthesize can run.",
    );
  }
  return credentials.openaiApiKey;
}
