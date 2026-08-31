/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every dashboard route is private, including auth redirects and error pages.
  async headers() {
    return [{
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }]
  },
}

export default nextConfig
