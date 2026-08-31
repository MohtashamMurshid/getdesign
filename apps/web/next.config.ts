import type { NextConfig } from "next";
import { buildAnalyticsConfig } from "@getdesign/analytics/config";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_POSTHOG_CONFIG: buildAnalyticsConfig(process.env) },
};

export default nextConfig;
