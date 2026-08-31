import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import {
  DOCS_ORIGIN,
  isProductionDeployment,
  SOCIAL_IMAGE,
  SOCIAL_IMAGE_ALT,
} from "./lib/site";

export const onRequest = defineRouteMiddleware(({ locals, url }) => {
  const route = locals.starlightRoute;
  const is404 = route.id === "404";
  const indexable = isProductionDeployment() && !is404;
  const canonical = new URL(url.pathname, DOCS_ORIGIN).href;
  const title = url.pathname === "/"
    ? "getdesign docs · Guides and API reference"
    : `${route.entry.data.title} · getdesign docs`;
  // Generated SDK pages have no descriptions. Add them here without editing TypeDoc output.
  const description = route.entry.data.description || (
    route.id.startsWith("reference/sdk")
      ? `TypeScript SDK reference for ${route.entry.data.title} in @getdesign/sdk. Usage, parameters, and types for generating a design.md.`
      : "Learn how to generate a design.md from a public URL with the getdesign web app, API, CLI, SDK, or coding agent skill."
  );

  const meta = {
    description,
    robots: indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow",
    "og:title": title,
    "og:description": description,
    "og:type": url.pathname === "/" ? "website" : "article",
    "og:url": canonical,
    "og:image": SOCIAL_IMAGE,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:type": "image/png",
    "og:image:alt": SOCIAL_IMAGE_ALT,
    "twitter:title": title,
    "twitter:description": description,
    "twitter:card": "summary_large_image",
    "twitter:image": SOCIAL_IMAGE,
    "twitter:image:alt": SOCIAL_IMAGE_ALT,
  };

  // Replace matching defaults so there is exactly one value for each metadata field.
  route.head = route.head.filter(({ tag, attrs }) => {
    if (tag === "title" || (tag === "link" && attrs?.rel === "canonical")) return false;
    if (!indexable && tag === "link" && attrs?.rel === "sitemap") return false;
    return !(tag === "meta" && String(attrs?.name ?? attrs?.property) in meta);
  });
  route.head.push({ tag: "title", content: title });
  if (!is404) route.head.push({ tag: "link", attrs: { rel: "canonical", href: canonical } });
  for (const [key, content] of Object.entries(meta)) {
    if (is404 && key === "og:url") continue;
    route.head.push({ tag: "meta", attrs: { [key.startsWith("og:") ? "property" : "name"]: key, content } });
  }
});
