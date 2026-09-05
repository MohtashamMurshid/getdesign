import type { NextConfig } from "next";
import { buildAnalyticsConfig } from "@getdesign/analytics/config";
import { isProductionDeployment } from "./app/_lib/indexing";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_POSTHOG_CONFIG: buildAnalyticsConfig(process.env) },
  async headers() {
    return isProductionDeployment() ? [] : [{
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }];
  },
};

export default nextConfig;
