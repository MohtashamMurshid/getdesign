import { buildAnalyticsConfig } from "@getdesign/analytics/config"

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_POSTHOG_CONFIG: buildAnalyticsConfig(process.env) },
}

export default nextConfig
