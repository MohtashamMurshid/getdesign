## Overall composition & rhythm

The page is a dark, single-column landing layout built from large horizontal sections separated by generous vertical spacing and faint dashed divider lines. Across all four tiles, the dominant canvas color is near-black, with content constrained to a centered max-width container that leaves comfortable left/right gutters (~48px at this viewport).

Rhythm is established through repeated patterns:

- **Thin dashed horizontal separators** between major sections.
- **Large headline + short explanatory paragraph** pairs.
- **Dark rounded panels/cards** with subtle borders, often split into columns.
- **Neon-lime accent** used sparingly for highlights, active states, and key tokens.
- **Terminal/editor metaphors** repeated in hero and “How it works” sections.

The visual pace goes:
1. Header + hero (two-column: text left, code panel right),
2. “How it works” explainer with two large side-by-side mock panels,
3. “Five surfaces” section with a 3-column-by-2-row card grid,
4. Waitlist CTA near bottom.

Everything is aligned to a strict grid. Edges, corners, and spacing are very consistent (cards commonly around 12–16px radius). The design uses restrained contrast: body copy is muted gray, headings are bright off-white, and accents pop in lime/yellow/blue/orange only where meaningful.

## Section-by-section walkthrough

### 1) Top navigation + hero (tile 1)

At the top is a fixed-looking header strip with logo left, nav links center, GitHub button right. Beneath, a dashed divider line.

Hero content sits in a two-column arrangement:

- **Left column**:
  - Small pill: green dot + “66 on the waitlist”.
  - Very large multi-line heading: “The design system for any URL.” with a lime block cursor-like square at the end.
  - Supporting paragraph describing extraction of palette/typography/components and outputting `design.md`.
  - Email input + “Join waitlist” button in a single row.
  - Small muted disclaimer text: “Private beta · Early access · No spam”.
  - Tiny inline list: “Web • API • CLI • SDK • Skill”.

- **Right column**:
  - Large dark editor-like panel with tabs (`design.md`, `getdesign.ts`) and top-right tiny label “cursor.com”.
  - Content resembles markdown with section headings and color tokens:
    - “# Design System Inspired by Cursor”
    - “## 1. Visual Theme & Atmosphere”
    - “## 2. Color Palette”
    - Color values listed with small swatches.
    - “## 3. Typography”
  - Bottom status bar: filename/sections/size + green “streaming” indicator.

### 2) “How it works” section (tile 2 + top of tile 3)

A dashed separator line introduces this section. Heading “How it works” with a short explanatory sentence.

Below is a **two-panel demo row**:

- **Left large panel** (browser/app UI simulation):
  - Top strip with three colored circles and centered URL field showing `getdesign.app`.
  - Left sidebar:
    - “TRY A URL” heading.
    - URL list items (`cursor.com`, `linear.app`, `stripe.com`) with icons.
    - Paste prompt row.
    - “SURFACES” list with `web`, `api`, `cli`, `sdk`, `skill`; `web` appears selected with a green status dot.
  - Main content area:
    - Status row: “ready · cursor.com” and `design.md` label.
    - Highlight bar with “cursor.com”.
    - Stacked content cards for Visual Theme, Palette, Typography.
    - Palette chips include hex values.
    - Typography line: “CursorGothic Display + Berkeley Mono” in lime.
    - Another output summary card: “design.md ready · 9 sections…”.
    - Bottom input-like strip: “ask a follow-up about cursor.com…” and token count “8/8”.

- **Right tall panel** (backend log):
  - Header “BACKEND” and “agent.run”.
  - Monospaced command log lines:
    - `getdesign.crawl(...)`
    - fetch timing
    - `getdesign.screenshot(...)` with viewport
    - `getdesign.extract(...)`
    - `getdesign.synthesize()`
    - completion line showing `design.md`, “9 sections”, “14.3KB”.
  - Bottom status row includes “200 OK”, duration “8.2s”, size, and “replay ↻”.

This entire section uses terminal-like syntax coloring: blue function names, lime strings/highlights, yellow metrics.

### 3) “Five surfaces, one agent.” (tile 3 into tile 4)

After another dashed separator appears the next heading: “Five surfaces, one agent.” plus subtext: “Four surfaces call the same agent core. The fifth runs inside yours.”

Main content is a large rounded rectangular grid panel subdivided by thin borders:

- **Top row cards**:
  1. **Web** — `getdesign.app`; description mentions streaming chat UI and live `design.md` artifact panel.
  2. **API** — `api.getdesign.app`; description references GET endpoint returning text/markdown, no auth in v1.
  3. **CLI** — `npx @getdesign/cli`; description mentions one-shot and interactive REPL, Bun binary.

- **Bottom row cards**:
  4. **SDK** — `npm i @getdesign/sdk`; typed client notes.
  5. **Skill** — `skills add MohtashamMurshid/getdesign`; mentions portable SKILL.md and usage inside Claude Code/Codex/Cursor.
  6. Rightmost cell is a blank/dim placeholder block with no visible text.

Each card has a small top-left index (`01`, `02`, etc.) and a tiny faint dot near top-right. Text hierarchy is consistent: title, lime command/domain line, muted descriptive sentence.

### 4) Bottom CTA area (tile 4)

Below the surfaces grid is another dashed divider and a centered call-to-action cluster:

- Small pill: green dot + “SHIPPING Q2 2026”.
- Large centered headline: “Get the first invite when getdesign ships.”
- Supporting line: “One email per milestone. The API, the CLI, the SDK. Nothing else.”
- Waitlist pill again: green dot + “66 on the waitlist”.
- Centered email input + “Join waitlist” button (same visual style as hero form).

The screenshot ends shortly below this form; no distinct footer links or legal text are visible in the provided tiles.

## Navigation & header

Header is a dark horizontal bar with subtle bottom divider (dashed line just below main nav region). Structure:

- **Left**: square bracket-like logo mark containing `[md]` in lime on dark background, followed by wordmark “getdesign” in light gray.
- **Center**: nav links in uppercase-ish sans text:
  - HOW IT WORKS
  - SURFACES
  - DOCS
  - DESIGN
  - WAITLIST
- **Right**: outlined rounded button with GitHub icon and label “GitHub”.

Active-state behavior is visible across tiles:
- In tile 2/3, “HOW IT WORKS” has lime underline.
- In tile 4, “SURFACES” has lime underline.
This implies scroll-linked section highlighting (visually observed as changing active underline between screenshots).

Spacing is balanced: nav links are evenly distributed with generous gaps; header has about 20–24px vertical padding.

## Hero / first impression

The first screen strongly prioritizes a large textual claim on the left and a product artifact preview on the right. First impression is “developer tooling + design extraction” via code-editor framing rather than marketing illustration.

Key hero traits:

- Headline is oversized, stacked over three lines, occupying substantial left-column height.
- Right panel is almost equally prominent, making the hero feel split 50/50.
- The waitlist form appears immediately beneath explanatory text, making the CTA primary.
- A green terminal-cursor motif (small lime square after headline text; green prompt symbol in input) reinforces tooling aesthetics.
- Social proof is minimal and numeric (“66 on the waitlist”) shown as a compact chip rather than large badge.

Overall it feels intentional and information-dense while still spacious due to large margins and line spacing.

## Imagery, iconography, illustration

No photographic imagery is visible. Visual language relies on UI mockups and minimal iconography.

Visible icon elements include:

- **GitHub mark** inside top-right button.
- **Small green status dots** in pills and status lines.
- **Traffic-light circles** (red/yellow/green) in app mock window chrome.
- **Site favicons/logomarks** in URL list (`cursor.com`, `linear.app`, `stripe.com`) in the “How it works” panel.
- **Tiny square/triangle terminal markers** preceding backend log commands.
- **Subtle bullet dots** separating inline metadata (`Web • API • CLI...`, status bars).
- **Tiny top-right dots** inside each surfaces card (decorative/status-like).

There are no illustrated characters, abstract blobs, gradients-as-illustration, or 3D assets. The core “imagery” is product interface simulation styled like code editors/terminal outputs.

## Typography in context

Typography appears to combine a clean sans-serif for UI/content and a monospaced face for code-like areas.

Observed hierarchy:

- **H1 hero**: very large, heavy weight, tight line spacing, bright off-white.
- **Section headings** (“How it works”, “Five surfaces, one agent.”): large but smaller than hero, semibold/bold.
- **Body copy**: medium size, muted gray, comfortable leading.
- **Navigation**: small uppercase-like labels with moderate tracking.
- **Code/editor text**:
  - Monospaced appearance in panels.
  - Syntax-like color coding.
  - Smaller sizes than body text in logs, slightly larger in key lines.
- **Card titles** in surfaces grid: medium-large sans.
- **Command/domain lines**: monospace and lime for emphasis.

There’s consistent contrast in weight and size: headings command attention; explanatory text recedes; metadata is smallest and dimmest.

## Color usage in context

Primary palette as seen:

- **Background**: near-black (#05060a-like).
- **Primary text**: off-white/light gray.
- **Secondary text**: medium gray.
- **Borders/dividers**: very dark gray with low contrast.
- **Accent**: neon/lime green used for:
  - Active nav underline
  - Pills’ status dots
  - Highlight words/numbers
  - Prompt symbols
  - Some command text
- **Additional syntax accents**:
  - Blue (function names / links in code panels)
  - Yellow/orange (timings, file size emphasis)
  - Pink/red (one palette swatch token)
  - White/gray swatches for neutral values

Color is restrained and functional: bright hues only appear where semantic emphasis or state is needed. Large areas remain dark and calm, giving high salience to small accent marks.

## Microcopy & messaging

Visible copy is concise and product-specific, with strong technical framing.

Notable lines:

- Hero claim: “The design system for any URL.”
- Explanation of process: opening site in real browser, extracting palette/typography/components, producing `design.md`.
- “How it works” sentence clarifies one shared “agent core” across surfaces.
- Section claim: “Five surfaces, one agent.”
- Surface cards each define one access mode with practical command/domain snippets.
- CTA microcopy reduces commitment anxiety:
  - “Private beta · Early access · No spam”
  - “One email per milestone… Nothing else.”

The wording is mostly declarative and implementation-oriented (crawl, screenshot, extract, synthesize). Even promotional areas stay terse and technical.

## Visible interaction affordances

Clearly visible interactive-looking elements:

- Top nav links (text links).
- GitHub button (outlined, rounded rectangle).
- Waitlist form:
  - Email input with placeholder `you@domain.com`
  - Primary button “Join waitlist”
- “How it works” mock interface includes many control affordances:
  - URL list items
  - Surface selector list
  - Follow-up input row
  - These are part of a demo panel, but visually rendered as controls.
- Backend panel “replay ↻” appears button/link-like.
- Active nav underline indicates selectable tab behavior.

Inputs and buttons have clear states through border, fill contrast, and cursor/prompt symbols. Buttons are high-contrast light fill on dark background, making CTA obvious.

## Footer & end-of-page

A conventional footer is **not visible** in the provided screenshots. The captured bottom portion ends within the waitlist CTA section, showing the form and surrounding content but no legal links, copyright notice, social icons row, or multi-column footer navigation.

The nearest “end” treatment is the centered CTA block with shipping timeline pill and repeated waitlist signup module.

## Notable details

- Repetition of **“66 on the waitlist”** in both hero and bottom CTA creates continuity.
- Active nav item changes between screenshots (`HOW IT WORKS` to `SURFACES`), implying section-aware header state.
- The hero right panel and later “How it works” panels share a **consistent editor/terminal visual grammar**, making the product concept legible without separate illustrations.
- Dashed horizontal separators are subtle but frequent, structuring long-scroll rhythm.
- Surfaces grid’s sixth cell appears intentionally empty/dim, preserving 3x2 grid symmetry despite only five named surfaces.
- Syntax-colored logs include explicit measurable outputs (latency, KB, section count), reinforcing technical credibility visually.
- Tiny details like `8/8` token indicator, status dots, and bottom status bars make panels feel “live” even as static screenshots.
- All major containers maintain consistent corner radius and border tone, giving component cohesion across sections.