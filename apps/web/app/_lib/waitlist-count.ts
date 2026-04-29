import { ConvexHttpClient } from "convex/browser";

import { api } from "@convex/_generated/api";

export async function getWaitlistCount(): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) return null;

  try {
    const client = new ConvexHttpClient(url);
    const count = await client.query(api.waitlist.count, {});
    return typeof count === "number" ? count : null;
  } catch (err) {
    console.error("waitlist_count_error", err);
    return null;
  }
}

export function formatWaitlistCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}
