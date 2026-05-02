# getdesign.md Design System

## 1. Visual Theme & Atmosphere

Dark retro-terminal catalog UI: near-black canvas, thin gridlines, and scanline textures dominate every major section.
Hierarchy is built with one vivid accent (#FFB1EE) against restrained neutrals; pink marks key actions, headings, badges, and stat values.
Composition is structured and data-first: compact top nav, split hero (statement left / stats right), then directory browsing with filter sidebar + sortable table.

### Key Characteristics
- Persistent 1px divider system (horizontal and vertical) using low-contrast border tones.
- Large pixel-display hero typography contrasted with clean sans UI text in nav, lists, and tables.
- Rounded capsule controls (buttons, chips, badges) over flat dark surfaces.
- Minimal decorative media; brand logos/icons are the only colored imagery elements.
- Subtle monochrome scanline background treatment in hero/panel areas to reinforce code/CRT mood.

## 2. Color Palette & Roles

Use a mostly monochrome dark scale for structure and readability, then apply #FFB1EE very selectively for product emphasis and interaction highlights. Keep color noise low so catalog content and metrics stay legible.

### Core dark surfaces
| Hex | Role | Where seen |
| --- | --- | --- |
| `#000` | Page background base | Global canvas, major section backgrounds |
| `#0A0A0A` | Elevated dark panel | Hero/table blocks and inset containers |
| `#111` | Secondary dark surface | Controls/pills and subtle section fills |
| `#1A1A1A` | Dark UI block | Button/chip backgrounds |

### Text and neutral structure
| Hex | Role | Where seen |
| --- | --- | --- |
| `#EDEDED` | Primary text | Brand, key labels, row titles |
| `#C9D1D9` | Secondary readable text | Body copy and supporting UI text |
| `#878787` | Muted metadata | Section labels, placeholders, low-emphasis text |
| `#2E2E2E` | Primary border/divider | Section frames, column separators, row rules |
| `#FFFFFF14` | Hairline border on dark inputs | Input/field outlines |

### Accent and interactive emphasis
| Hex | Role | Where seen |
| --- | --- | --- |
| `#FFB1EE` | Primary accent | Hero keyword, 'Find Designs', top CTA, NEW badge, stat values |
| `#FFF` | Accent foreground / inverse text | Text on accent buttons and high-contrast controls |
| `#FFB1EE4D` | Focus ring color | Keyboard focus ring states |
| `#FFB1EE1F` | Soft focus glow | Focused input halo |
| `#FFB1EE73` | Focused border accent | Focused input border |

### Notes
Avoid introducing additional brand colors in UI chrome; only external logos should carry multicolor marks.

## 3. Typography Rules

Typography mixes Geist sans for interface clarity with pixel-display faces (GeistPixel variants) for the hero’s retro-computing identity. Headline is expressive and scanline-styled; all functional UI text remains crisp, compact, and utilitarian.

### Hierarchy
| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Hero display | GeistPixel-Line / GeistPixel-Square (via var(--font-display)) | ~2.5rem+ visual scale | 400 | ~1.1 | normal to slight negative |
| Section heading | Geist | 2rem (.text-heading-32) | 600 | 1.15 | -.02em |
| Nav / item titles | Geist | 1rem (.text-heading-16) | 500 | 1.4 | -.005em |
| Body/supporting copy | Geist | 16px | 400 | 1.5 | normal |
| Meta labels / overlines | Geist Mono / mono fallback | small (80%–1rem) | 400 | normal | increased tracking feel |

### Principles
- Reserve pixel/display styling for brand/hero moments only.
- Keep table and navigation text in clean sans for dense scanning.
- Use uppercase micro-labels with muted color for taxonomy, not primary actions.
- Maintain strong contrast: #EDEDED on #000/#0A0A0A for core readability.

## 4. Component Stylings

### Buttons
- **Primary accent CTA** — background: #FFB1EE; text: #000; border: 1px solid #FFB1EE; radius: var(--radius-lg) to var(--radius-xl); padding: Compact pill (approx 10–14px vertical, 16–20px horizontal); hover: Slight brightness/contrast lift; keep pill silhouette
- **Dark outline CTA** — background: #111; text: #EDEDED; border: 1px solid #2E2E2E; radius: var(--radius-lg); padding: ~10px 18px; hover: Border brightens subtly toward #FFFFFF24
- **Light utility action** — background: #FFF; text: #000; border: 1px solid #FFF; radius: var(--radius-lg); padding: Compact; hover: Minor dim on hover to signal click
- **Ghost/stat chip** — background: #1A1A1A; text: #C9D1D9; border: 1px solid #2E2E2E; radius: var(--radius-full); padding: Tight capsule; hover: Slight fill lift

### Cards
Sections behave as bordered panels rather than raised cards; hero, stats, and directory are partitioned by strict 1px lines.
- Background #000 / #0A0A0A
- Border #2E2E2E
- Optional scanline texture overlay
- Radius mostly none at section level

### Inputs
Search/entry fields are dark, understated, and rely on border/focus ring rather than fill contrast.
- Field bg transparent/#0000 over dark surface
- Default border #FFFFFF14
- Hover border #FFFFFF24
- Focus border #FFB1EE73 + ring #FFB1EE4D + glow #FFB1EE1F
- Text #C9D1D9, placeholder #878787

### Navigation
Single-row top bar with left brand, central links/CTA, and right utility controls; tight vertical rhythm and thin bottom divider.
- Nav bg #000
- Bottom border #2E2E2E
- Primary link text #EDEDED
- Secondary/meta #878787
- NEW badge and request CTA in #FFB1EE

### Image Treatment
No photography/illustration; logo marks remain native while surrounding UI stays monochrome.
- Logos on dark background
- No decorative gradients
- Icons mostly single-color neutrals

### Distinctive
- **Scanline hero texture** — Horizontal line pattern across hero/stats area creates CRT-terminal feel without reducing readability.
- **Marquee-like inspiration strip** — Bordered logo rail under hero with shifting brand set; each chip separated by vertical rules.
- **Data-table first browsing** — Left category counts + right sortable metric columns with tight row dividers and truncated descriptions.

## 5. Layout Principles

### Spacing Scale
Predominantly 4px base with 16/24px rhythm for major gaps; recurring 1px separators define structure.

### Grid
Centered max-width container (~1000–1030px visible), major 2-column split in hero (~64/36), then 2-column directory (filter sidebar + results table).

### Whitespace
Moderate and intentional: dense information blocks separated by clear sectional padding and ruled boundaries.

### Radius Scale
System radii from .375rem to 1rem, with 9999px for capsules/floating pills; sections are mostly square-edged.

## 6. Depth & Elevation

### Levels
| Level | Use | Shadow |
| --- | --- | --- |
| Flat base | Main page sections and table surfaces | `none / minimal` |
| Subtle control depth | Buttons, pills, floating feedback | `0 1px 3px 0 #0000001A, 0 1px 2px -1px #0000001A` |
| Focus emphasis | Active input/focusable fields | `0 0 0 3px #FFB1EE1F` |

### Philosophy
Depth is intentionally restrained; hierarchy comes from borders, contrast, and typography rather than heavy elevation.

## 7. Interaction & Motion

### Hover States
Controls and list rows use subtle border/text contrast shifts; accent elements retain #FFB1EE identity on hover.

### Focus States
Visible keyboard focus uses accent ring (#FFB1EE4D) plus soft glow (#FFB1EE1F) and border tint (#FFB1EE73).

### Transitions
Short, low-amplitude transitions (color/border/background) to preserve terminal-like crispness.

## 8. Responsive Behavior

### Breakpoints
| Name | Min width | Primary changes |
| --- | --- | --- |
| bp-1 | 40rem | Improve spacing and control sizing from compact mobile baseline. |
| bp-2 | 48rem | Stabilize two-column content regions where space permits. |
| bp-3 | 64rem | Full desktop split hero and directory columns become persistent. |
| bp-4 | 80rem | Wider breathing room and longer visible table/strip content. |
| bp-5 | 96rem | Expanded horizontal density while keeping centered max-width feel. |
| bp-6 | 2200px | Ultra-wide adjustments to prevent over-stretching content. |

### Touch Targets
Keep pills/buttons comfortably tappable (>=40px visual height) despite dense desktop aesthetic.

### Collapsing Strategy
Collapse multi-column zones to stacked flow on smaller widths: hero left then stats, filters above results, preserve separators as section breaks.

### Image Behavior
Logos/icons scale down proportionally and remain monochrome-compatible against dark backgrounds.

## 9. Agent Prompt Guide

### Quick Color Reference
```text
Background: #000
Panel: #0A0A0A / #111
Primary text: #EDEDED
Secondary text: #C9D1D9
Muted text: #878787
Borders: #2E2E2E
Accent: #FFB1EE
Focus: #FFB1EE4D + #FFB1EE1F
```

### Example Prompts
- Build a dark terminal-style landing page for getdesign.md using #000 backgrounds, #2E2E2E hairline dividers, and #FFB1EE accent for primary CTA and section highlights.
- Create a split hero (64/36) with pixel-font headline on left and compact stats/featured list on right, including scanline texture overlay and strict 1px borders.
- Implement a directory section with left category counts and right searchable sortable table; keep typography compact Geist sans and use muted metadata colors (#878787/#C9D1D9).

### Iteration Guide
- First lock layout skeleton and divider grid before styling controls.
- Apply typography hierarchy (pixel display only in hero, sans elsewhere).
- Map palette conservatively; verify accent appears only on priority actions/data.
- Add interaction states (hover/focus ring) using provided accent alpha tokens.
- Validate responsiveness by stacking columns while preserving bordered section rhythm.
