import { ConvexHttpClient } from "convex/browser";

export function getConvexClient(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL or CONVEX_URL.");
  }
  const client = new ConvexHttpClient(url);
  if (accessToken) client.setAuth(accessToken);
  return client;
}
