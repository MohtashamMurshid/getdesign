import { test } from "node:test";
import assert from "node:assert/strict";

import {
  crawlSite,
  daytonaOpenUrlCommand,
  buildSnapshotTag,
  extractDesignTokens,
  renderDesignMd,
} from "../src";

test("crawlSite resolves linked stylesheets and inline style blocks", async () => {
  const html = `
    <html>
      <head>
        <link rel="stylesheet" href="/styles/app.css" />
        <style>:root { --brand: #5E6AD2; }</style>
      </head>
      <body></body>
    </html>
  `;

  const stylesheet = `
    @import url("./theme.css");
    body { background: #0A0A0A; color: #FAFAFA; }
  `;

  const theme = `
    @font-face {
      font-family: "Inter";
      src: url("/fonts/inter.woff2") format("woff2");
      font-weight: 400 700;
    }

    @media (min-width: 1024px) {
      .grid { gap: 24px; }
    }
  `;

  const seen: string[] = [];
  const crawl = await crawlSite({
    url: "https://example.com",
    fetch: async (url) => {
      seen.push(url);
      if (url === "https://example.com") return new Response(html);
      if (url === "https://example.com/styles/app.css") {
        return new Response(stylesheet);
      }
      if (url === "https://example.com/styles/theme.css") return new Response(theme);

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.deepEqual(seen, [
    "https://example.com",
    "https://example.com/styles/app.css",
    "https://example.com/styles/theme.css",
  ]);
  assert.equal(crawl.stylesheets.length, 3);
  assert.ok(crawl.stylesheets.some((asset) => asset.kind === "imported"));
  assert.ok(crawl.stylesheets.some((asset) => asset.kind === "inline"));
});

test("extractDesignTokens derives a grounded token set", () => {
  const crawl = {
    sourceUrl: "https://example.com",
    siteName: "Example",
    html: "<html><head><title>Example</title></head><body></body></html>",
    stylesheets: [
      {
        kind: "linked" as const,
        source: "https://example.com/styles.css",
        content: `
          @font-face {
            font-family: "Inter";
            src: url("/fonts/inter.woff2") format("woff2");
            font-weight: 400;
          }

          :root {
            --bg: #0A0A0A;
            --fg: #FAFAFA;
            --accent: #5E6AD2;
            --radius-lg: 16px;
          }

          body {
            background: var(--bg);
            color: var(--fg);
            font-family: Inter, sans-serif;
            font-size: 16px;
            line-height: 1.6;
          }

          .button {
            background: #5E6AD2;
            color: #FAFAFA;
            padding: 12px 18px;
            border-radius: 999px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }

          .card {
            background: #16171B;
            border: 1px solid #26282C;
            border-radius: 16px;
            padding: 24px;
          }

          @media (min-width: 1024px) {
            .layout { gap: 32px; }
          }
        `,
        url: "https://example.com/styles.css",
      },
    ],
    sourceUrls: ["https://example.com", "https://example.com/styles.css"],
    notes: [],
  };

  const tokens = extractDesignTokens({
    sourceUrl: "https://example.com",
    crawlResult: crawl,
    siteName: "Example",
  });

  assert.equal(tokens.siteName, "Example");
  assert.equal(tokens.colors.accent[0]?.hex, "#5E6AD2");
  assert.equal(tokens.typography.fontFamilies[0]?.family, "Inter");
  assert.equal(tokens.breakpoints[0]?.minWidth, "1024px");
});

test("renderDesignMd outputs the required 9 sections in order", () => {
  const markdown = renderDesignMd({
    siteName: "Example",
    sourceUrl: "https://example.com",
    visualTheme: {
      overview: [
        "Dark-first and technical with a clear product focus.",
        "Accent usage stays concentrated around primary actions and state changes.",
      ],
      keyCharacteristics: [
        "Dark neutral base",
        "Single vivid accent",
        "Hairline borders",
        "Rounded media",
        "Calm motion",
      ],
    },
    palette: {
      philosophy: "A restrained neutral system holds the layout together while one accent color marks importance.",
      groups: [
        {
          heading: "Primary",
          entries: [{ hex: "#0A0A0A", role: "Surface base", whereSeen: "body" }],
        },
      ],
      notes: "Accent is reserved for buttons and active states.",
    },
    typography: {
      summary: "Inter drives both display and body typography.",
      hierarchy: [
        {
          role: "Body",
          font: "Inter",
          size: "16px",
          weight: "400",
          lineHeight: "1.6",
          letterSpacing: "0",
        },
      ],
      principles: ["Tight display tracking.", "Readable measures.", "Limited weight range."],
    },
    components: {
      buttons: [
        {
          variant: "primary",
          background: "#5E6AD2",
          textColor: "#FAFAFA",
          border: "1px solid #5E6AD2",
          radius: "999px",
          padding: "12px 18px",
          hoverShift: "Slight darken and raise.",
        },
      ],
      cards: { description: "Raised cards with quiet borders.", tokens: ["Radius: 16px"] },
      inputs: { description: "Low-contrast fields with visible focus rings.", tokens: ["Ring: 2px accent"] },
      navigation: { description: "Horizontal desktop nav with active emphasis.", tokens: ["Sticky header"] },
      imageTreatment: { description: "Rounded images with no decorative framing.", tokens: ["Radius: 20px"] },
      distinctive: [
        { name: "Hero panel", description: "Large framing around the lead narrative." },
        { name: "Feature card", description: "Compact bordered summary blocks." },
      ],
    },
    layout: {
      spacingScale: "Uses 8px-derived spacing with 12px and 24px supporting steps.",
      grid: "Wide centered container that relaxes into fewer columns on smaller screens.",
      whitespace: "Generous section spacing balances denser internal card layouts.",
      radiusScale: "Medium and large radii dominate, with pill buttons for actions.",
    },
    depth: {
      levels: [{ level: "1", use: "Cards", shadow: "0 8px 24px rgba(0,0,0,0.12)" }],
      philosophy: "Depth stays soft and secondary to borders and tonal separation.",
    },
    interaction: {
      hoverStates: "Buttons darken slightly and lift by 1px.",
      focusStates: "Accent rings remain clearly visible on keyboard focus.",
      transitions: "Short ease-out transitions cover color, opacity, and transform.",
    },
    responsive: {
      breakpoints: [{ name: "lg", minWidth: "1024px", primaryChanges: "More columns and expanded nav." }],
      touchTargets: "Primary tap targets stay at or above 44px.",
      collapsingStrategy: "Navigation condenses and dense grids simplify on narrow screens.",
      imageBehavior: "Media scales proportionally and preserves primary focal content.",
    },
    agentPromptGuide: {
      quickColorReference: [
        "#0A0A0A // surface-base",
        "#16171B // surface-raised",
        "#5E6AD2 // accent-primary",
        "#FAFAFA // text-inverse",
        "#26282C // border-subtle",
        "#10B981 // semantic-success",
      ],
      examplePrompts: [
        "Build a dark landing page with #5E6AD2 CTAs and neutral cards.",
        "Use Inter with tight spacing and pill buttons for the action layer.",
        "Prefer quiet borders and restrained motion for emphasis.",
      ],
      iterationGuide: [
        "Keep the accent reserved for emphasis.",
        "Preserve the 8px rhythm.",
        "Favor borders over stronger shadows.",
        "Use larger radii on cards than on inputs.",
      ],
    },
  });

  const headings = [
    "## 1. Visual Theme & Atmosphere",
    "## 2. Color Palette & Roles",
    "## 3. Typography Rules",
    "## 4. Component Stylings",
    "## 5. Layout Principles",
    "## 6. Depth & Elevation",
    "## 7. Interaction & Motion",
    "## 8. Responsive Behavior",
    "## 9. Agent Prompt Guide",
  ];

  for (const heading of headings) {
    assert.ok(markdown.includes(heading), `missing heading: ${heading}`);
  }

  assert.ok(markdown.indexOf(headings[0]) < markdown.indexOf(headings[8]));
});

test("daytonaOpenUrlCommand quotes the target URL", () => {
  const command = daytonaOpenUrlCommand(
    "https://example.com/path?utm=1&name=test",
  );

  assert.ok(command.includes("chromium"));
  assert.ok(command.includes("\"https://example.com/path?utm=1&name=test\""));
  assert.equal(buildSnapshotTag("ac10286"), "getdesign-ac10286");
});
