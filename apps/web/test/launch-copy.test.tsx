import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

import Home from "../app/page";
import { HeroSection } from "../app/_components/home/hero-section";
import { FinalCtaSection } from "../app/_components/home/final-cta-section";
import { SurfacesSection } from "../app/_components/home/surfaces-section";
import { ComponentsSection } from "../app/design/_components/components-section";
import { ApiSurface } from "../app/_components/interactive-demo/surfaces/api-surface";
import { CliSurface } from "../app/_components/interactive-demo/surfaces/cli-surface";
import { SdkSurface } from "../app/_components/interactive-demo/surfaces/sdk-surface";
import { SITES } from "../app/_components/interactive-demo/constants";
import { SITE_DASHBOARD_URL } from "../app/_lib/site";
import { GET as getLlms } from "../app/llms.txt/route";
import { GET as getLlmsFull } from "../app/llms-full.txt/route";

const staleCopy = /No auth in v1|Auth: none|Not in v1|Shipping Q\d|Free beta|private beta early access|npx @getdesign\/cli|Node 18\+|One-shot (?:and|or) interactive REPL|streaming to stdout|process\.stdout\.write\(chunk\)/i;

describe("V1 launch copy and links", () => {
  test("navigation, hero, final CTA and footer keep the dashboard destination", () => {
    expect(SITE_DASHBOARD_URL).toBe("https://dashboard.getdesign.app");
    const html = renderToStaticMarkup(<Home />);
    const dashboardLinks = html.match(new RegExp(`href="${SITE_DASHBOARD_URL}"`, "g"));
    expect(dashboardLinks).toHaveLength(4);
    expect(html).not.toMatch(/href="#(?:waitlist|cta)"|Join (?:the )?waitlist/i);
    expect(html).not.toMatch(staleCopy);
    expect(html).toContain("animated demo, not a live extraction");
  });

  test("hero keeps its CTA with setup and provider costs in the final section", () => {
    const hero = renderToStaticMarkup(<HeroSection />);
    expect(hero).toContain(`href="${SITE_DASHBOARD_URL}"`);
    expect(hero).toContain("Extract a design system");
    expect(hero).not.toContain("Sign in");
    expect(hero).not.toContain("Bring your own Daytona and OpenAI keys");
    expect(hero).not.toContain("Pay those providers directly");
    const final = renderToStaticMarkup(<FinalCtaSection />);
    expect(final).toContain(`href="${SITE_DASHBOARD_URL}"`);
    expect(final).toContain("Sign in");
    expect(final).toContain("Daytona and OpenAI keys in Account");
    expect(final).toContain("no getdesign run billing");
    expect(final).toContain("Daytona for browser capture and OpenAI for model usage");
  });

  test("surface cards describe authenticated API and local Bun execution", () => {
    const html = renderToStaticMarkup(<SurfacesSection />);
    expect(html).toContain("GET /v1/design");
    expect(html).toContain("WorkOS bearer auth and provider keys required");
    expect(html).toContain("bunx @getdesign/cli");
    expect(html).toContain("in-process on Bun");
    expect(html).not.toMatch(staleCopy);
  });

  test("design examples use the current beta badge and dashboard CTA", () => {
    const html = renderToStaticMarkup(<ComponentsSection />);
    expect(html).toContain("Now in beta");
    expect(html).toContain(`href="${SITE_DASHBOARD_URL}"`);
    expect(html).not.toMatch(/Shipping|waitlist/i);
  });

  test("API example includes auth and BYOK headers and waits for the result", () => {
    const html = renderToStaticMarkup(<ApiSurface site={SITES[0]} visibleSteps={8} done />);
    expect(html).toContain("/v1/design?url=https://cursor.com");
    expect(html).toContain("Authorization: Bearer $WORKOS_ACCESS_TOKEN");
    expect(html).toContain("x-daytona-api-key: $DAYTONA_API_KEY");
    expect(html).toContain("x-openai-api-key: $OPENAI_API_KEY");
    expect(html).toContain("200 OK");
    const pending = renderToStaticMarkup(<ApiSurface site={SITES[0]} visibleSteps={2} done={false} />);
    expect(pending).not.toMatch(/200 OK|200 streaming/);
  });

  test("CLI and SDK demos show credentials, Bun and the real output contract", () => {
    const cli = renderToStaticMarkup(<CliSurface site={SITES[0]} visibleSteps={8} done />);
    expect(cli).toContain("bunx @getdesign/cli https://cursor.com --out design.md");
    expect(cli).toContain("DAYTONA_API_KEY and OPENAI_API_KEY");
    expect(cli).not.toMatch(staleCopy);
    const sdk = renderToStaticMarkup(<SdkSurface site={SITES[0]} visibleSteps={8} done />);
    expect(sdk).toContain("Bun server");
    expect(sdk).toContain("credentials:");
    expect(sdk).toContain("process.env.DAYTONA_API_KEY");
    expect(sdk).toContain("process.env.OPENAI_API_KEY");
    expect(sdk).toContain("event.result.markdown");
    expect(sdk).not.toMatch(staleCopy);
    const heroCode = readFileSync(new URL("../app/_components/home/hero-card.tsx", import.meta.url), "utf8");
    expect(heroCode).toContain("https://cursor.com");
    expect(heroCode).toContain("process.env.DAYTONA_API_KEY");
    expect(heroCode).toContain("process.env.OPENAI_API_KEY");
  });

  for (const [name, handler] of [["llms.txt", getLlms], ["llms-full.txt", getLlmsFull]] as const) {
    test(`${name} matches the hosted auth, cost and SDK contract`, async () => {
      const response = handler();
      expect(response.headers.get("Content-Type")).toContain("text/plain");
      const body = await response.text();
      expect(body).toContain(SITE_DASHBOARD_URL);
      expect(body).toContain("Authorization: Bearer <WorkOS access token>");
      expect(body).toContain("x-daytona-api-key");
      expect(body).toContain("x-openai-api-key");
      expect(body).toContain("no getdesign API key");
      expect(body).toContain("no getdesign run billing");
      expect(body).toContain("/v1/design/stream");
      expect(body).toContain("in-process on");
      expect(body).not.toMatch(staleCopy);
      expect(body).not.toMatch(/Promise<string>|AsyncIterable<string>/);
    });
  }

  test("FAQ structured data describes WorkOS auth and provider costs", () => {
    const html = renderToStaticMarkup(<Home />);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const data = blocks.flatMap((match) => JSON.parse(match[1]));
    const faq = data.find((entry) => entry["@type"] === "FAQPage");
    const answer = faq.mainEntity.find((entry: { name: string }) => entry.name.includes("authentication")).acceptedAnswer.text;
    expect(answer).toContain("WorkOS access token");
    expect(answer).toContain("no getdesign run billing");
    expect(answer).toContain("Daytona for browser capture and OpenAI for model usage");
  });

  test("linked onboarding docs do not reintroduce obsolete launch claims", () => {
    const files = ["index", "quickstart", "surfaces/web", "surfaces/api", "surfaces/cli", "surfaces/sdk", "resources/faq", "resources/official-urls", "guides/sdk-in-next", "guides/call-the-api"];
    for (const file of files) {
      const body = readFileSync(new URL(`../../docs/src/content/docs/${file}.mdx`, import.meta.url), "utf8");
      expect(body).not.toMatch(staleCopy);
    }
    const api = readFileSync(new URL("../../docs/src/content/docs/surfaces/api.mdx", import.meta.url), "utf8");
    expect(api).toContain("/v1/design/stream");
    expect(api).not.toContain("`viewport`");
    expect(api).not.toContain("429");
  });
});
