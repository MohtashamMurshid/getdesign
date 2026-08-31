import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Run against each real build, e.g. SEO_BUILD_ENV=preview SEO_DOCS_DIST=/tmp/docs/dist bun test scripts/seo-build.test.ts
const environment = process.env.SEO_BUILD_ENV;
const production = environment === "production";
const webDir = process.env.SEO_WEB_BUILD ?? "apps/web/.next";
const docsDir = process.env.SEO_DOCS_DIST ?? "apps/docs/dist";

async function inspect(file: string) {
  const html = readFileSync(file, "utf8");
  const meta = new Map<string, string[]>();
  const canonicals: string[] = [];
  const headings: number[] = [];
  const titles: string[] = [];
  const rewriter = new HTMLRewriter()
    .on("meta", { element(element) {
      const key = element.getAttribute("name") ?? element.getAttribute("property");
      if (key) meta.set(key, [...meta.get(key) ?? [], element.getAttribute("content") ?? ""]);
    } })
    .on('link[rel="canonical"]', { element(element) { canonicals.push(element.getAttribute("href")!); } })
    .on("h1,h2,h3,h4,h5,h6", { element(element) { headings.push(Number(element.tagName[1])); } })
    .on("head > title", { text(chunk) { if (chunk.text) titles.push(chunk.text); } });
  await rewriter.transform(new Response(html)).text();
  return { html, meta, canonicals, headings, titles };
}

describe.skipIf(!environment)(`rendered ${environment} SEO`, () => {
  const webPages = [
    { file: "index.html", url: "https://www.getdesign.app", title: "getdesign · the design system for any URL" },
    { file: "design.html", url: "https://www.getdesign.app/design", title: "Design · getdesign" },
  ];
  const docsPages = existsSync(docsDir)
    ? readdirSync(docsDir, { recursive: true }).filter((file) => String(file).endsWith(".html")).map(String)
    : [];

  for (const { file, url, title } of webPages) {
    test(`marketing ${file}`, async () => {
      const page = await inspect(join(webDir, "server/app", file));
      expect(page.titles).toEqual([title]);
      expect(page.canonicals).toEqual([url]);
      expect(page.meta.get("og:url")).toEqual([url]);
      expect(page.meta.get("robots")?.[0]).toContain(production ? "index, follow" : "noindex, nofollow");
      for (const key of ["og:image", "twitter:image"]) {
        expect(page.meta.get(key)).toEqual(["https://www.getdesign.app/opengraph-image"]);
      }
      expect(page.meta.get("description")).toHaveLength(1);
      expect(page.headings.filter((level) => level === 1)).toHaveLength(1);
      expect(page.headings[0]).toBe(1);
      expect(page.headings.slice(1).every((level) => level === 2)).toBe(true);
    });
  }

  test("docs build is present", () => expect(docsPages.length).toBeGreaterThan(20));
  for (const file of docsPages) {
    test(`docs ${file}`, async () => {
      const page = await inspect(join(docsDir, file));
      const is404 = file === "404.html";
      const url = `https://docs.getdesign.app/${file.replace(/index\.html$/, "")}`;
      expect(page.titles).toHaveLength(1);
      expect(page.titles[0]).toContain("getdesign docs");
      expect(page.canonicals).toEqual(is404 ? [] : [url]);
      expect(page.meta.get("robots")).toEqual([production && !is404 ? "index,follow,max-image-preview:large" : "noindex,nofollow"]);
      expect(page.meta.get("description")?.[0].length).toBeGreaterThan(20);
      for (const key of ["og:image", "twitter:image"]) expect(page.meta.get(key)).toEqual(["https://www.getdesign.app/opengraph-image"]);
      expect(page.headings.filter((level) => level === 1)).toHaveLength(1);
      expect(page.headings.every((level, index) => index === 0 || level <= page.headings[index - 1] + 1)).toBe(true);
      const graph = JSON.parse(page.html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)![1])["@graph"];
      const article = graph.find((entry: Record<string, unknown>) => entry["@type"] === "TechArticle");
      if (is404) expect(article).toBeUndefined();
      else {
        expect(article.url).toBe(url);
        expect(article.headline).not.toBe("getdesign docs");
      }
    });
  }

  test("sitemaps and robots expose only production pages", () => {
    const routes = JSON.parse(readFileSync(join(webDir, "routes-manifest.json"), "utf8"));
    const noindex = routes.headers.flatMap((route: { headers: { key: string; value: string }[] }) => route.headers)
      .filter(({ key }: { key: string }) => key.toLowerCase() === "x-robots-tag");
    expect(noindex).toEqual(production ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
    const webSitemap = readFileSync(join(webDir, "server/app/sitemap.xml.body"), "utf8");
    const webRobots = readFileSync(join(webDir, "server/app/robots.txt.body"), "utf8");
    const docsRobots = readFileSync(join(docsDir, "robots.txt"), "utf8");
    if (production) {
      expect(webSitemap.match(/<loc>/g)).toHaveLength(2);
      expect(webSitemap).not.toMatch(/dashboard|vercel\.app|localhost|<lastmod>/);
      expect(webRobots).toContain("Sitemap: https://www.getdesign.app/sitemap.xml");
      expect(docsRobots).toContain("Sitemap: https://docs.getdesign.app/sitemap-index.xml");
      const sitemap = readFileSync(join(docsDir, "sitemap-0.xml"), "utf8");
      const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
      expect(urls.length).toBe(docsPages.length - 1);
      for (const url of urls) {
        expect(url).toStartWith("https://docs.getdesign.app/");
        expect(url).not.toContain("404");
        expect(existsSync(join(docsDir, new URL(url).pathname, "index.html"))).toBe(true);
      }
    } else {
      expect(webSitemap).not.toContain("<loc>");
      expect(webRobots).toContain("Disallow: /");
      expect(webRobots).not.toContain("Sitemap:");
      expect(docsRobots).toBe("User-agent: *\nDisallow: /\n");
      expect(existsSync(join(docsDir, "sitemap-index.xml"))).toBe(false);
    }
  });
});
