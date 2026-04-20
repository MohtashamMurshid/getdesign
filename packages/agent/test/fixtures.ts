import type { DesignDoc } from "@getdesign/types";

export const SAMPLE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta property="og:site_name" content="Acme" />
    <title>Acme — Build better</title>
    <link rel="stylesheet" href="/style.css" />
    <style>
      :root {
        --accent: #5e6ad2;
        --surface: #0a0a0a;
        --text: #fafafa;
      }
      body {
        background: var(--surface);
        color: var(--text);
        font-family: "Inter", system-ui, sans-serif;
        font-size: 16px;
        line-height: 1.6;
      }
      @media (min-width: 1024px) {
        main { max-width: 1120px; }
      }
    </style>
  </head>
  <body><h1>Acme</h1></body>
</html>`;

export const SAMPLE_CSS = `
  .btn {
    background: #5e6ad2;
    color: #fafafa;
    border: 1px solid #5e6ad2;
    border-radius: 999px;
    padding: 12px 18px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .card {
    background: #16171b;
    border: 1px solid #26282c;
    border-radius: 16px;
    padding: 24px;
  }
  h1 {
    font-family: "Inter", sans-serif;
    font-size: 48px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
`;

export const SAMPLE_DESIGN_DOC: DesignDoc = {
  siteName: "Acme",
  sourceUrl: "https://example.com",
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
    philosophy:
      "Monochrome neutrals anchor the interface while one saturated accent carries emphasis.",
    groups: [
      {
        heading: "Primary",
        entries: [
          { hex: "#0A0A0A", role: "Surface base", whereSeen: "body background" },
          { hex: "#5E6AD2", role: "Accent", whereSeen: "buttons" },
        ],
      },
    ],
    notes: "Accent usage stays concentrated in buttons, links, and active indicators.",
  },
  typography: {
    summary:
      "Display and body typography share a tight, modern sans stack with restrained variation.",
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
      description:
        "Inputs use low-contrast fills and a visible accent ring on focus.",
      tokens: ["Border: 1px solid #26282C", "Focus ring: 2px #5E6AD2"],
    },
    navigation: {
      description:
        "Desktop navigation is horizontal with active states shown by contrast and accent.",
      tokens: ["Sticky header", "Compact gap rhythm"],
    },
    imageTreatment: {
      description: "Images keep rounded corners and avoid decorative frames.",
      tokens: ["Radius: 20px", "High-contrast screenshots"],
    },
    distinctive: [
      {
        name: "Hero terminal",
        description:
          "A code-like hero module pairs product copy with dense UI.",
      },
      {
        name: "Command cards",
        description:
          "Feature cards present actions in a compact, bordered layout.",
      },
    ],
  },
  layout: {
    spacingScale:
      "The layout uses a predominantly 8px-based ramp with occasional 12px and 24px steps.",
    grid: "Content centers within a wide max-width container and relaxes into fewer columns on narrow screens.",
    whitespace:
      "Whitespace is generous in hero and section breaks, but denser within cards and command surfaces.",
    radiusScale:
      "Corners cluster around medium and large rounded values, with pills reserved for buttons and chips.",
  },
  depth: {
    levels: [
      { level: "1", use: "Resting cards", shadow: "0 4px 12px rgba(0,0,0,0.08)" },
    ],
    philosophy:
      "Depth is subtle and mostly reinforced through tonal separation plus hairline borders.",
  },
  interaction: {
    hoverStates: "Buttons and links shift color or opacity with restrained motion.",
    focusStates:
      "Visible focus rings use the accent hue and remain present on keyboard navigation.",
    transitions:
      "State changes favor short ease-out transitions on color, opacity, and transform.",
  },
  responsive: {
    breakpoints: [
      {
        name: "lg",
        minWidth: "1024px",
        primaryChanges: "Navigation expands and multi-column sections appear.",
      },
    ],
    touchTargets: "Primary tap targets stay at or above 44px in height on mobile.",
    collapsingStrategy:
      "Navigation condenses behind a hamburger while dense grids simplify to single-column stacks.",
    imageBehavior:
      "Hero images preserve framing with object-fit cover semantics and scale down without cropping core content.",
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
};
