import { api } from "@convex/_generated/api";

import { getConvexClient } from "@/lib/convex-server";
import { decryptCredential } from "@/lib/credential-crypto";

export type RunCredentials = {
  daytonaApiKey?: string;
  openaiApiKey?: string;
};

export async function resolveRunCredentials(
  userId: string,
): Promise<RunCredentials> {
  const convex = getConvexClient();
  const [daytona, openai] = await Promise.all([
    convex.query(api.userCredentials.getEncrypted, {
      userId,
      provider: "daytona",
    }),
    convex.query(api.userCredentials.getEncrypted, {
      userId,
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
