import type { MetadataRoute } from "next";

import { SITE_DOMAIN } from "./_lib/site";
import { isProductionDeployment } from "./_lib/indexing";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isProductionDeployment()) return [];
  return [
    {
      url: SITE_DOMAIN,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_DOMAIN}/design`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
