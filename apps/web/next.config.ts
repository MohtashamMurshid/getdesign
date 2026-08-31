import type { NextConfig } from "next";
import { isProductionDeployment } from "./app/_lib/indexing";

const nextConfig: NextConfig = {
  async headers() {
    return isProductionDeployment() ? [] : [{
      source: "/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }];
  },
};

export default nextConfig;
