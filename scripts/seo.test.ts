import { afterEach, describe, expect, test } from "bun:test";
import webRobots from "../apps/web/app/robots";
import webSitemap from "../apps/web/app/sitemap";
import webConfig from "../apps/web/next.config";
import dashboardConfig from "../apps/dashboard/next.config.mjs";
import dashboardRobots from "../apps/dashboard/app/robots";
import { GET as docsRobots } from "../apps/docs/src/pages/robots.txt";
import { onRequest as docsMetadata } from "../apps/docs/src/route-middleware";
import { isProductionDeployment as webProduction } from "../apps/web/app/_lib/indexing";
import { isProductionDeployment as docsProduction } from "../apps/docs/src/lib/site";

const original = { ...process.env };
afterEach(() => {
  for (const key of ["VERCEL_ENV", "VERCEL_TARGET_ENV", "NODE_ENV"]) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

function deployment(value?: string) {
  delete process.env.VERCEL_TARGET_ENV;
  delete process.env.VERCEL_ENV;
  if (value) process.env.VERCEL_ENV = value;
  process.env.NODE_ENV = "production";
}

describe("deployment indexing policy", () => {
  for (const environment of ["production", "preview", "development", undefined]) {
    test(`${environment ?? "unset"} uses Vercel deployment status, not NODE_ENV`, async () => {
      deployment(environment);
      const indexable = environment === "production";
      expect(webProduction()).toBe(indexable);
      expect(docsProduction()).toBe(indexable);
      const robots = webRobots();
      const docs = await (await docsRobots({} as never)).text();
      if (indexable) {
        expect(robots.sitemap).toBe("https://www.getdesign.app/sitemap.xml");
        expect(webSitemap().map(({ url }) => url)).toEqual([
          "https://www.getdesign.app", "https://www.getdesign.app/design",
        ]);
        expect(docs).toContain("Sitemap: https://docs.getdesign.app/sitemap-index.xml");
        expect(await webConfig.headers!()).toEqual([]);
      } else {
        expect(robots).toEqual({ rules: { userAgent: "*", disallow: "/" } });
        expect(webSitemap()).toEqual([]);
        expect(docs).toBe("User-agent: *\nDisallow: /\n");
        expect((await webConfig.headers!())[0].headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, nofollow" });
      }
      expect(await dashboardConfig.headers()).toEqual([{
        source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      }]);
      expect(dashboardRobots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    });
  }

  test("custom staging environments cannot inherit production indexing", () => {
    deployment("production");
    process.env.VERCEL_TARGET_ENV = "staging";
    expect(webProduction()).toBe(false);
    expect(docsProduction()).toBe(false);
  });
});

describe("documentation metadata", () => {
  for (const environment of ["production", "preview"]) {
    for (const id of ["quickstart", "reference/sdk/functions/getDesign", "404"]) {
      test(`${environment} ${id} has one metadata value and production URLs`, async () => {
        deployment(environment);
        const route = {
          id, entry: { data: { title: id === "quickstart" ? "Quickstart" : "getDesign" } },
          head: [
            { tag: "title", content: "old title" },
            { tag: "meta", attrs: { name: "robots", content: "index" } },
            { tag: "meta", attrs: { property: "og:url", content: "http://localhost/" } },
            { tag: "link", attrs: { rel: "canonical", href: "http://localhost/" } },
            { tag: "link", attrs: { rel: "sitemap", href: "/sitemap-index.xml" } },
          ],
        };
        await docsMetadata({ locals: { starlightRoute: route }, url: new URL(`https://preview.vercel.app/${id}/?query=ignored`) } as never, async () => {});
        const fields = (key: string) => route.head.filter(({ attrs }) => attrs?.name === key || attrs?.property === key);
        expect(fields("robots")).toHaveLength(1);
        expect(fields("robots")[0].attrs?.content).toBe(environment === "production" && id !== "404" ? "index,follow,max-image-preview:large" : "noindex,nofollow");
        const canonical = route.head.filter(({ attrs }) => attrs?.rel === "canonical");
        expect(canonical).toHaveLength(id === "404" ? 0 : 1);
        if (id !== "404") expect(canonical[0].attrs?.href).toBe(`https://docs.getdesign.app/${id}/`);
        expect(fields("og:image")[0].attrs?.content).toBe("https://www.getdesign.app/opengraph-image");
        expect(fields("twitter:image")[0].attrs?.content).toBe("https://www.getdesign.app/opengraph-image");
        expect(route.head.filter(({ tag }) => tag === "title")).toHaveLength(1);
        expect(fields("description")[0].attrs?.content).toBeTruthy();
        expect(JSON.stringify(route.head)).not.toMatch(/localhost|preview\.vercel/);
      });
    }
  }
});
