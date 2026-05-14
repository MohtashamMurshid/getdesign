"use server";

import { ConvexHttpClient } from "convex/browser";
import { withAuth } from "@workos-inc/authkit-nextjs";

import { api } from "@convex/_generated/api";

function convexUrl() {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
}

export async function createDesignRunAction(url: string) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const endpoint = convexUrl();

  if (!endpoint) {
    return {
      id: `preview-${Date.now()}`,
      preview: true,
    };
  }

  const client = new ConvexHttpClient(endpoint);
  const id = await client.mutation(api.designRuns.create, {
    userId: user.id,
    userEmail: user.email,
    url,
  });

  await client.action(api.designRuns.start, {
    id,
    userId: user.id,
  });

  return { id, preview: false };
}
