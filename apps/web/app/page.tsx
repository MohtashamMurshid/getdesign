import { HomePage } from "./_components/home/home-page";
import { JsonLd } from "./_components/json-ld";
import { MarketingShell } from "./_components/marketing-shell";
import { SiteFooter } from "./_components/site-footer";
import { SITE_DOMAIN, SITE_NAME } from "./_lib/site";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: `What is ${SITE_NAME}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${SITE_NAME} is a developer tool that turns any public URL into a production-grade design system. An agent opens the site in a real browser, extracts palette, typography, and components from the actual computed CSS, and returns a design.md file.`,
      },
    },
    {
      "@type": "Question",
      name: `How does ${SITE_NAME} work?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: "A headless browser renders the target URL, the agent walks the DOM and reads computed styles, clusters tokens to find real design decisions, identifies components, and writes the result to Markdown.",
      },
    },
    {
      "@type": "Question",
      name: `What surfaces does ${SITE_NAME} provide?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: "Five surfaces share one agent core: a web chat UI, an HTTP API at api.getdesign.app, a CLI published as @getdesign/cli, a TypeScript SDK published as @getdesign/sdk, and a portable Skill that runs inside Claude Code, Codex, and Cursor.",
      },
    },
    {
      "@type": "Question",
      name: "Does it scrape HTML?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. It renders the site in a real browser and reads computed CSS, so the extracted tokens reflect what users actually see.",
      },
    },
    {
      "@type": "Question",
      name: "Is there authentication or a paid tier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not in v1. The beta is free, with rate limits. Private beta early access is available on the home page.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_DOMAIN,
    },
  ],
};

export default function Home() {
  return (
    <MarketingShell footer={<SiteFooter />}>
      <HomePage />
      <JsonLd data={[faqJsonLd, breadcrumbJsonLd]} />
    </MarketingShell>
  );
}
