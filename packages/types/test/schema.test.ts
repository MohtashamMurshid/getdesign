import { test } from "node:test";
import assert from "node:assert/strict";

import { designDocSchema, designTokensSchema } from "../src";

test("designTokensSchema parses grounded token payloads", () => {
  const result = designTokensSchema.parse({
    siteName: "Cursor",
    sourceUrl: "https://cursor.com",
    sources: ["https://cursor.com", "https://cursor.com/styles.css"],
    colors: {
      primary: [{ hex: "#0A0A0A", role: "surface base", source: ":root --bg" }],
      accent: [{ hex: "#5E6AD2", role: "primary CTA", source: ":root --accent" }],
      neutral: [{ hex: "#FAFAFA", role: "text inverse", source: "body" }],
      semantic: {
        success: [{ hex: "#10B981", role: "success badge", source: ".success" }],
        warning: [],
        error: [{ hex: "#EF4444", role: "error banner", source: ".error" }],
        info: [],
      },
      surfaces: [{ hex: "#16171B", role: "surface raised", source: ".card" }],
      borders: [{ hex: "#26282C", role: "border subtle", source: ".card" }],
    },
    typography: {
      fontFamilies: [
        {
          family: "Inter",
          role: "body",
          source: "@font-face",
          weights: ["400", "500", "600"],
        },
      ],
      scale: [
        {
          role: "Body",
          size: "16px",
          weight: "400",
          lineHeight: "1.6",
          letterSpacing: "0",
          source: "body",
        },
      ],
    },
    spacing: [{ value: "8px", source: ".stack", usageCount: 4 }],
    radii: [{ name: "md", value: "12px", source: ":root --radius-md" }],
    shadows: [{ value: "0 4px 12px rgba(0,0,0,0.08)", role: "card", source: ".card" }],
    borders: [
      {
        width: "1px",
        style: "solid",
        color: "#26282C",
        role: "card border",
        source: ".card",
      },
    ],
    breakpoints: [{ name: "lg", minWidth: "1024px", source: "@media (min-width: 1024px)" }],
  });

  assert.equal(result.colors.accent[0]?.hex, "#5E6AD2");
  assert.equal(result.typography.fontFamilies[0]?.family, "Inter");
});

test("designDocSchema enforces the 9-section contract", () => {
  const result = designDocSchema.parse({
    siteName: "Cursor",
    sourceUrl: "https://cursor.com",
    visualTheme: {
      overview: [
        "Dark-first and technical, with a calm but assertive product voice.",
        "Minimal surfaces keep the accent hue reserved for calls to action and status changes.",
      ],
      keyCharacteristics: [
        "Dark neutral surface ramp",
        "Single vivid accent for actions",
        "Hairline borders over heavy shadows",
        "Tight display typography",
        "Consistent 8px spacing rhythm",
      ],
    },
    palette: {
      philosophy: "Monochrome neutrals anchor the interface while one saturated accent carries emphasis.",
      groups: [
        {
          heading: "Primary",
          entries: [{ hex: "#0A0A0A", role: "Surface base", whereSeen: "body background" }],
        },
      ],
      notes: "Accent usage stays concentrated in buttons, links, and active indicators.",
    },
    typography: {
      summary: "Display and body typography share a tight, modern sans stack with restrained variation.",
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
      principles: [
        "Display sizes use tighter tracking than body text.",
        "Body copy keeps a readable measure.",
        "Weights step up sparingly for emphasis.",
      ],
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
          hoverShift: "Darken background slightly and raise by 1px.",
        },
      ],
      cards: {
        description: "Cards sit on a raised neutral surface with a quiet border.",
        tokens: ["Surface: #16171B", "Radius: 16px"],
      },
      inputs: {
        description: "Inputs use low-contrast fills and a visible accent ring on focus.",
        tokens: ["Border: 1px solid #26282C", "Focus ring: 2px #5E6AD2"],
      },
      navigation: {
        description: "Desktop navigation is horizontal with active states shown by contrast and accent.",
        tokens: ["Sticky header", "Compact gap rhythm"],
      },
      imageTreatment: {
        description: "Images keep rounded corners and avoid decorative frames.",
        tokens: ["Radius: 20px", "High-contrast screenshots"],
      },
      distinctive: [
        { name: "Hero terminal", description: "A code-like hero module pairs product copy with dense UI." },
        { name: "Command cards", description: "Feature cards present actions in a compact, bordered layout." },
      ],
    },
    layout: {
      spacingScale: "The layout uses a predominantly 8px-based ramp with occasional 12px and 24px steps.",
      grid: "Content centers within a wide max-width container and relaxes into fewer columns on narrow screens.",
      whitespace: "Whitespace is generous in hero and section breaks, but denser within cards and command surfaces.",
      radiusScale: "Corners cluster around medium and large rounded values, with pills reserved for buttons and chips.",
    },
    depth: {
      levels: [{ level: "1", use: "Resting cards", shadow: "0 4px 12px rgba(0,0,0,0.08)" }],
      philosophy: "Depth is subtle and mostly reinforced through tonal separation plus hairline borders.",
    },
    interaction: {
      hoverStates: "Buttons and links shift color or opacity with restrained motion.",
      focusStates: "Visible focus rings use the accent hue and remain present on keyboard navigation.",
      transitions: "State changes favor short ease-out transitions on color, opacity, and transform.",
    },
    responsive: {
      breakpoints: [{ name: "lg", minWidth: "1024px", primaryChanges: "Navigation expands and multi-column sections appear." }],
      touchTargets: "Primary tap targets stay at or above 44px in height on mobile.",
      collapsingStrategy: "Navigation condenses behind a hamburger while dense grids simplify to single-column stacks.",
      imageBehavior: "Hero images preserve framing with object-fit cover semantics and scale down without cropping core content.",
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
        "Build a dark product landing page using #0A0A0A backgrounds, #16171B cards, and #5E6AD2 primary CTAs.",
        "Use tight sans-serif display typography, hairline borders, and restrained hover motion for a technical UI.",
        "Create pill-shaped primary buttons and rounded screenshot cards with subtle neutral separation.",
      ],
      iterationGuide: [
        "Keep the accent limited to actions and active states.",
        "Prefer borders before adding deeper shadows.",
        "Preserve the 8px spacing rhythm when expanding sections.",
        "Use larger radii on screenshots and cards than on inputs.",
      ],
    },
  });

  assert.equal(result.agentPromptGuide.examplePrompts.length, 3);
  assert.equal(result.palette.groups[0]?.heading, "Primary");
});

test("designDocSchema rejects incomplete visual theme characteristics", () => {
  assert.throws(() =>
    designDocSchema.parse({
      siteName: "Broken",
      sourceUrl: "https://example.com",
      visualTheme: {
        overview: ["Only one paragraph."],
        keyCharacteristics: ["Only one characteristic."],
      },
      palette: {
        philosophy: "x",
        groups: [{ heading: "Primary", entries: [{ hex: "#000", role: "base", whereSeen: "body" }] }],
        notes: "x",
      },
      typography: {
        summary: "x",
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
        principles: ["a", "b", "c"],
      },
      components: {
        buttons: [
          {
            variant: "primary",
            background: "#000",
            textColor: "#fff",
            border: "1px solid #000",
            radius: "999px",
            padding: "12px 18px",
            hoverShift: "none",
          },
        ],
        cards: { description: "x", tokens: ["x"] },
        inputs: { description: "x", tokens: ["x"] },
        navigation: { description: "x", tokens: ["x"] },
        imageTreatment: { description: "x", tokens: ["x"] },
        distinctive: [
          { name: "one", description: "x" },
          { name: "two", description: "x" },
        ],
      },
      layout: {
        spacingScale: "x",
        grid: "x",
        whitespace: "x",
        radiusScale: "x",
      },
      depth: {
        levels: [{ level: "1", use: "Cards", shadow: "none" }],
        philosophy: "x",
      },
      interaction: {
        hoverStates: "x",
        focusStates: "x",
        transitions: "x",
      },
      responsive: {
        breakpoints: [{ name: "sm", minWidth: "640px", primaryChanges: "x" }],
        touchTargets: "x",
        collapsingStrategy: "x",
        imageBehavior: "x",
      },
      agentPromptGuide: {
        quickColorReference: [
          "#000000 // base",
          "#111111 // raised",
          "#222222 // accent",
          "#333333 // text",
          "#444444 // border",
          "#555555 // success",
        ],
        examplePrompts: ["a", "b", "c"],
        iterationGuide: ["a", "b", "c", "d"],
      },
    }),
  );
});
