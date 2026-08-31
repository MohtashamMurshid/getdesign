import { relayAnalytics } from "@getdesign/analytics/relay";

export async function POST(request: Request) {
  return relayAnalytics(
    request,
    process.env.NEXT_PUBLIC_POSTHOG_CONFIG,
    "dashboard",
  );
}
