import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CAPTURE_RUNTIME_VERSION,
  captureSnapshotName,
  crawlSite,
  daytonaOpenUrlCommand,
  buildSnapshotTag,
  deriveSiteName,
  ensureDaytonaCaptureSnapshot,
  extractDesignTokens,
  normalizeScreenshotResponse,
  renderDesignMd,
} from "../src";

import { __testing as cdpTesting } from "../src/daytona/cdp";

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

test("daytonaOpenUrlCommand quotes the target URL", () => {
  const command = daytonaOpenUrlCommand(
    "https://example.com/path?utm=1&name=$(id)",
  );

  assert.ok(command.includes("chromium"));
  assert.ok(command.includes("getdesign-chromium"));
  assert.ok(command.includes("DISPLAY=':1'"));
  assert.ok(command.includes("'https://example.com/path?utm=1&name=$(id)'"));
  assert.ok(!command.includes("\"https://example.com/path?utm=1&name=$(id)\""));
  assert.equal(buildSnapshotTag("ac10286"), "getdesign-ac10286");
});

test("captureSnapshotName produces a stable per-version name", () => {
  assert.equal(
    captureSnapshotName(),
    `getdesign-capture-${CAPTURE_RUNTIME_VERSION}`,
  );
  assert.equal(
    captureSnapshotName("2026-06-01-b"),
    "getdesign-capture-2026-06-01-b",
  );
});

test("normalizeScreenshotResponse handles current and legacy SDK shapes", () => {
  const current = normalizeScreenshotResponse({
    screenshot: "BASE64_FROM_DAYTONA",
    sizeBytes: 1234,
  });
  assert.equal(current.imageBase64, "BASE64_FROM_DAYTONA");
  assert.equal(current.sizeBytes, 1234);

  const legacy = normalizeScreenshotResponse({
    image: "BASE64_LEGACY",
    size_bytes: 99,
    width: 100,
    height: 50,
    format: "png",
  });
  assert.equal(legacy.imageBase64, "BASE64_LEGACY");
  assert.equal(legacy.sizeBytes, 99);
  assert.equal(legacy.width, 100);
  assert.equal(legacy.height, 50);
  assert.equal(legacy.format, "png");

  assert.throws(
    () => normalizeScreenshotResponse({ sizeBytes: 1 }),
    /did not contain image data/,
  );
});

test("ensureDaytonaCaptureSnapshot reuses an active snapshot", async () => {
  const calls: string[] = [];
  const fakeClient = {
    snapshot: {
      get: async (name: string) => {
        calls.push(`get:${name}`);
        return { name, state: "active" };
      },
      create: async () => {
        calls.push("create");
        throw new Error("create should not be called when snapshot is active");
      },
    },
  } as unknown as Parameters<typeof ensureDaytonaCaptureSnapshot>[0];

  const result = await ensureDaytonaCaptureSnapshot(fakeClient, {
    snapshotName: "getdesign-capture-test-active",
  });

  assert.equal(result.status, "ready");
  assert.equal(result.created, false);
  assert.equal(result.snapshotName, "getdesign-capture-test-active");
  assert.deepEqual(calls, ["get:getdesign-capture-test-active"]);
});

test("ensureDaytonaCaptureSnapshot creates a missing snapshot and waits until active", async () => {
  let getCalls = 0;
  let createCalls = 0;
  const fakeClient = {
    snapshot: {
      get: async (name: string) => {
        getCalls += 1;
        if (getCalls === 1) {
          const error: Error & { response?: { status: number } } = Object.assign(
            new Error("not found"),
            { response: { status: 404 } },
          );
          throw error;
        }
        if (getCalls === 2) return { name, state: "pending" };
        return { name, state: "active" };
      },
      create: async () => {
        createCalls += 1;
        return { name: "x", state: "pending" } as unknown;
      },
    },
  } as unknown as Parameters<typeof ensureDaytonaCaptureSnapshot>[0];

  const events: string[] = [];
  const result = await ensureDaytonaCaptureSnapshot(fakeClient, {
    snapshotName: "getdesign-capture-test-missing",
    image: "ghcr.io/example/runtime@sha256:abc",
    waitForActiveSeconds: 5,
    onStatus: (event) => events.push(`${event.status}`),
  });

  assert.equal(result.status, "ready");
  assert.equal(result.created, true);
  assert.equal(createCalls, 1);
  assert.ok(events.includes("provisioning"));
  assert.equal(events.at(-1), "ready");
});

test("CDP client issues correct frames for documentHeight and scrollTo", async () => {
  type SentFrame = { id: number; method: string; params: Record<string, unknown> };
  const sent: SentFrame[] = [];
  let onMessage: ((event: { data: string }) => void) | null = null;

  const fakeSocket = {
    readyState: 1,
    onopen: null as ((ev: unknown) => unknown) | null,
    onmessage: null as ((ev: { data: string }) => unknown) | null,
    onerror: null as ((ev: unknown) => unknown) | null,
    onclose: null as ((ev: unknown) => unknown) | null,
    send(data: string) {
      const frame = JSON.parse(data) as SentFrame;
      sent.push(frame);
      // Auto-respond per method so the client's pending map resolves.
      const reply: { id: number; result?: unknown } = { id: frame.id };
      if (frame.method === "Runtime.evaluate") {
        const expression = String(
          (frame.params as { expression?: unknown }).expression ?? "",
        );
        if (expression.includes("scrollHeight")) {
          reply.result = { result: { value: 4321 } };
        } else if (expression.startsWith("window.scrollTo")) {
          reply.result = { result: { value: undefined } };
        } else {
          reply.result = { result: { value: null } };
        }
      } else {
        reply.result = {};
      }
      // Defer to next tick so send() returns first.
      queueMicrotask(() => onMessage?.({ data: JSON.stringify(reply) }));
    },
    close() {
      /* no-op */
    },
  };

  const transport = new cdpTesting.JsonRpcCdpTransport(fakeSocket);
  // bind onMessage from the transport-installed handler
  onMessage = fakeSocket.onmessage as typeof onMessage;
  const client = cdpTesting.buildClient(transport);

  const height = await client.documentHeight();
  assert.equal(height, 4321);
  await client.scrollTo(900);

  assert.equal(sent.length, 2);
  assert.equal(sent[0]?.method, "Runtime.evaluate");
  assert.match(
    String((sent[0]?.params as { expression?: unknown }).expression ?? ""),
    /scrollHeight/,
  );
  assert.equal(sent[1]?.method, "Runtime.evaluate");
  assert.match(
    String((sent[1]?.params as { expression?: unknown }).expression ?? ""),
    /window\.scrollTo\(0, 900\)/,
  );

  await client.close();
});

test("ensureDaytonaCaptureSnapshot returns failed status on terminal snapshot state", async () => {
  const fakeClient = {
    snapshot: {
      get: async (name: string) => ({ name, state: "build_failed", errorReason: "registry unreachable" }),
      create: async () => ({ name: "x", state: "pending" } as unknown),
    },
  } as unknown as Parameters<typeof ensureDaytonaCaptureSnapshot>[0];

  const result = await ensureDaytonaCaptureSnapshot(fakeClient, {
    snapshotName: "getdesign-capture-test-failed",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.created, false);
  assert.match(String(result.reason), /build_failed/);
});
