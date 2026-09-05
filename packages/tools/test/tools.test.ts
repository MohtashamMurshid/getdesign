import { test } from "node:test";
import assert from "node:assert/strict";

import {
  crawlSite,
  deriveSiteName,
  extractDesignTokens,
  renderDesignMd,
} from "../src";
import {
  buildChromiumWrapperScript,
  CDP_PORT,
  shouldInstallI18nFonts,
} from "../src/daytona";

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

test("crawlSite blocks redirects to private targets", async () => {
  await assert.rejects(
    () =>
      crawlSite({
        url: "https://example.com",
        fetch: async (url, init) => {
          assert.equal(init?.redirect, "manual");
          assert.equal(url, "https://example.com");
          return new Response(null, {
            status: 302,
            headers: {
              location: "https://127.0.0.1/private.css",
            },
          });
        },
      }),
    /Blocked redirect target/,
  );
});

test("crawlSite safely truncates oversized HTML and stylesheets", async () => {
  const htmlPrefix = `
    <html>
      <head>
        <title>Example</title>
        <link rel="stylesheet" href="/styles/app.css" />
      </head>
      <body>`;
  const stylesheetPrefix = ".hero { color: #123456; }";
  const htmlLimit = Buffer.byteLength(htmlPrefix, "utf8") + 2;
  const stylesheetLimit = Buffer.byteLength(stylesheetPrefix, "utf8") + 2;

  const crawl = await crawlSite({
    url: "https://example.com",
    maxHtmlBytes: htmlLimit,
    maxStylesheetBytes: stylesheetLimit,
    fetch: async (url) => {
      if (url === "https://example.com") {
        return new Response(`${htmlPrefix}😀 ignored tail`);
      }
      if (url === "https://example.com/styles/app.css") {
        return new Response(`${stylesheetPrefix}😀 ignored tail`);
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.equal(crawl.html, htmlPrefix);
  assert.equal(crawl.stylesheets[0]?.content, stylesheetPrefix);
  assert.ok(Buffer.byteLength(crawl.html, "utf8") <= htmlLimit);
  assert.ok(
    Buffer.byteLength(crawl.stylesheets[0]?.content ?? "", "utf8") <=
      stylesheetLimit,
  );
  assert.doesNotMatch(crawl.html, /�/u);
  assert.doesNotMatch(crawl.stylesheets[0]?.content ?? "", /�/u);
});

test("crawlSite skips failed linked and imported stylesheets", async () => {
  const html = `
    <html>
      <head>
        <title>Example</title>
        <link rel="stylesheet" href="/styles/app.css" />
        <link rel="stylesheet" href="/styles/missing.css" />
      </head>
    </html>`;
  const appCss = `
    @import url("./missing-fonts.css");
    @import url("./theme.css");
    body { color: #111111; }`;

  const crawl = await crawlSite({
    url: "https://example.com",
    fetch: async (url) => {
      if (url === "https://example.com") return new Response(html);
      if (url === "https://example.com/styles/app.css") {
        return new Response(appCss);
      }
      if (url === "https://example.com/styles/theme.css") {
        return new Response(":root { --accent: #5e6ad2; }");
      }
      if (url === "https://example.com/styles/missing-fonts.css") {
        return new Response("Not found", {
          status: 404,
          statusText: "Not Found",
        });
      }
      if (url === "https://example.com/styles/missing.css") {
        throw new Error("network unavailable");
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.deepEqual(
    crawl.stylesheets.map((stylesheet) => [stylesheet.kind, stylesheet.url]),
    [
      ["linked", "https://example.com/styles/app.css"],
      ["imported", "https://example.com/styles/theme.css"],
    ],
  );
  assert.ok(
    crawl.notes.some(
      (note) =>
        note.includes("Skipped imported stylesheet") &&
        note.includes("missing-fonts.css") &&
        note.includes("404 Not Found"),
    ),
  );
  assert.ok(
    crawl.notes.some(
      (note) =>
        note.includes("Skipped linked stylesheet") &&
        note.includes("missing.css") &&
        note.includes("network unavailable"),
    ),
  );
  assert.ok(crawl.notes.includes("Fetched 1 of 2 linked stylesheets."));
});

test("deriveSiteName falls back when the cleaned title is empty", () => {
  const html = `
    <html>
      <head><title>| Example</title></head>
      <body></body>
    </html>
  `;

  assert.equal(
    deriveSiteName(html, "https://www.example.com"),
    "example.com",
  );
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

test("extractDesignTokens ignores empty shadow declarations", () => {
  const tokens = extractDesignTokens({
    sourceUrl: "https://example.com",
    siteName: "Example",
    html: "<html><head><title>Example</title></head><body></body></html>",
    stylesheets: [
      {
        kind: "inline",
        source: "inline-style-1",
        content:
          ":root { --shadow-empty: ; --shadow-card: 0 2px 8px #0003; } body { font-family: system-ui; font-size: 16px; }",
      },
    ],
  });

  assert.deepEqual(
    tokens.shadows.map((shadow) => shadow.value),
    ["0 2px 8px #0003"],
  );
});

test("extractDesignTokens merges repeated font-face weights and preserves inline stylesheet sources", () => {
  const tokens = extractDesignTokens({
    sourceUrl: "https://example.com",
    html: "<html><head><title>Example</title></head><body></body></html>",
    stylesheets: [
      {
        kind: "linked",
        source: "https://example.com/styles.css",
        url: "https://example.com/styles.css",
        content: `
          @font-face {
            font-family: "Inter";
            src: url("/fonts/inter-regular.woff2") format("woff2");
            font-weight: 400;
          }

          @font-face {
            font-family: "Inter";
            src: url("/fonts/inter-bold.woff2") format("woff2");
            font-weight: 700;
          }
        `,
      },
      {
        kind: "inline",
        source: "inline-style-1",
        content: `
          body {
            font-family: Inter, sans-serif;
            font-size: 16px;
            color: #111111;
          }
        `,
      },
    ],
  });

  assert.deepEqual(tokens.sources, [
    "https://example.com/styles.css",
    "https://example.com",
  ]);
  assert.deepEqual(tokens.typography.fontFamilies[0]?.weights, ["400", "700"]);
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
          entries: [{ hex: "#0A0A0A", role: "Surface | base", whereSeen: "body\nhero" }],
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
        "#0A0A0A // surface ``` base",
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
  assert.ok(markdown.includes("Surface \\| base"));
  assert.ok(markdown.includes("body hero"));
  assert.match(markdown, /`\u200B``/u);
});

test("shouldInstallI18nFonts: latin URLs are skipped, i18n TLDs and IDN trigger install", () => {
  assert.equal(shouldInstallI18nFonts("https://example.com"), false);
  assert.equal(shouldInstallI18nFonts("https://stripe.com"), false);
  assert.equal(shouldInstallI18nFonts("https://taobao.cn"), true);
  assert.equal(shouldInstallI18nFonts("https://example.co.jp"), true);
  assert.equal(shouldInstallI18nFonts("https://news.naver.kr"), true);
  assert.equal(shouldInstallI18nFonts("https://yandex.ru"), true);
  assert.equal(shouldInstallI18nFonts("https://xn--fsq.com"), true);
  assert.equal(shouldInstallI18nFonts("not a url"), false);
});

test("buildChromiumWrapperScript embeds the required Chromium flags", () => {
  const script = buildChromiumWrapperScript({ width: 1440, height: 900 });
  assert.match(script, /--no-sandbox/);
  assert.match(script, /--disable-dev-shm-usage/);
  assert.match(script, /--no-first-run/);
  assert.match(script, /--no-default-browser-check/);
  assert.match(script, /--hide-scrollbars/);
  assert.match(script, /--force-color-profile=srgb/);
  assert.match(script, /--remote-debugging-address=127\.0\.0\.1/);
  assert.match(
    script,
    new RegExp(`--remote-debugging-port=${CDP_PORT}`),
  );
  // Chromium 144+ requires this flag for in-sandbox CDP WebSocket handshakes.
  assert.match(script, /--remote-allow-origins=\*/);
  assert.match(script, /--kiosk/);
  assert.match(script, /--window-size=1440,900/);
});
