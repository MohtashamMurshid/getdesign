import { buildAnalyticsConfig } from "@getdesign/analytics/config"

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_POSTHOG_CONFIG: buildAnalyticsConfig(process.env) },
  // Every dashboard route is private, including auth redirects and error pages.
  async headers() {
    return [{
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }]
  },
}

export default nextConfig
