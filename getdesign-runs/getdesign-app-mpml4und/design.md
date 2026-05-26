# getdesign Design System

## 1. Visual Theme & Atmosphere

Dark, code-native landing page aesthetic with restrained contrast and sparse neon accents.
Single-column long-scroll structure segmented by faint dashed horizontal dividers.
Product UI mockups (editor/terminal/browser chrome) are the primary visual storytelling device instead of illustrations or photography.

### Key Characteristics
- Near-black canvas with layered dark surfaces (#0A0A0B, #101012, #141418, #1A1A20).
- Accent-led emphasis using lime (#A3E635) for active states, status dots, and key command/domain text.
- Monospace syntax colors in demo panels (blue #60A5FA, yellow #FBBF24, violet #C084FC, pink #F472B6).
- Consistent rounded geometry using tokenized radii (sm/md/lg/xl + rounded-full pill treatments).
- Dense but orderly information hierarchy: oversized hero claim, muted explanatory text, compact metadata lines.

## 2. Color Palette & Roles

Keep most UI in low-contrast dark neutrals, reserve bright chroma for semantic emphasis, active navigation, and code-token legibility.

### Core dark + text system
| Hex | Role | Where seen |
| --- | --- | --- |
| `#0A0A0B` | App background / inverse text on light button | Global page background, dark panels, primary button text |
| `#EDEDEE` | Primary foreground | Headlines, high-emphasis body text, light button fill |
| `#EDEDEE99` | Muted foreground | Secondary paragraphs, metadata, helper copy |
| `#EDEDEE61` | Subtle text/border-adjacent tone | Low-emphasis UI text and subdued labels |
| `#EDEDEE1F` | Faint separators/overlays | Very light divider and low-contrast panel detailing |

### Surface layering
| Hex | Role | Where seen |
| --- | --- | --- |
| `#101012` | Surface 100 | Cards/panels and container blocks |
| `#141418` | Surface 200 | Nested mock-interface regions |
| `#1A1A20` | Surface 300 | Raised subsections and denser demo panes |
| `#0000` | Transparent surface | Native form control resets and transparent layers |

### Accent + syntax
| Hex | Role | Where seen |
| --- | --- | --- |
| `#A3E635` | Primary accent | Active nav underline, status dots, key command/domain text |
| `#65A30D` | Dim accent | Secondary accent moments and subdued green states |
| `#A3E6352E` | Accent glow | Soft glow/selection-like accent backing |
| `#60A5FA` | Function/info syntax | Code-like function names in mock terminal/editor |
| `#C084FC` | Keyword syntax | Code keyword highlighting |
| `#FBBF24` | Numeric/metric syntax | Timings, counts, file-size emphasis in logs |
| `#F472B6` | Variable syntax | Variable-like token highlighting |
| `#F87171` | Danger/error | Danger semantic token and error text moments |

### Borders and utility colors
| Hex | Role | Where seen |
| --- | --- | --- |
| `#FFFFFF12` | Default border | Card outlines, control borders, section framing |
| `#FFFFFF24` | Strong border | Higher-emphasis boundary lines |
| `#27C93F` | Window control green | Browser chrome traffic-light dot in mock UI |
| `#FF5F56` | Window control red | Browser chrome traffic-light dot in mock UI |
| `#0A0A0BB3` | Dark text 70% alpha | Reduced-contrast dark-on-light text contexts |

### Notes
All hex values are sourced directly from extracted tokens; no inferred colors added.

## 3. Typography Rules

Primary UI typography uses Geist (sans) with a code layer in JetBrains Mono/system monospace stacks. Scale is utility-driven with many small UI sizes and conservative defaults.

### Hierarchy
| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Body | Geist, Geist Fallback, var(--font-geist), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif | 16px | 400 | 1.5 | normal |
| Body | Geist, Geist Fallback | 16px | 400 | normal | normal |
| H1 | inherit | inherit | inherit | normal | normal |
| Mono | JetBrains Mono, JetBrains Mono Fallback, var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace | 16px | 400 | normal | normal |
| Mono | var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace | 1em | 400 | normal | normal |
| Small | inherit | 80% | 400 | normal | normal |
| Body | inherit | 75% | 400 | 0 | normal |
| Body | inherit | var(--text-xs) | 400 | var(--tw-leading,var(--text-xs--line-height)) | normal |
| Small | inherit | 10.5px | 400 | normal | normal |
| Small | inherit | 10px | 400 | normal | normal |
| Small | inherit | 9.5px | 400 | normal | normal |
| Small | inherit | 9px | 400 | normal | normal |

### Principles
- Let large marketing headings be driven by contextual utility classes while semantic h1-h6 remain inherit-based.
- Use sans for product/UI narrative; switch to mono for commands, logs, token values, and artifact content.
- Preserve muted contrast for supporting copy and reserve bright text colors for stateful/semantic highlights.

## 4. Component Stylings

### Buttons
- **Primary CTA (Join waitlist)** — background: #EDEDEE; text: #0A0A0B; border: 1px solid #FFFFFF12; radius: border-radius: var(--radius-md) and/or border-radius: .375rem; padding: Compact horizontal CTA sizing (tokenized utilities); keep form-row fit; hover: Increase border emphasis toward #FFFFFF24 or subtle luminance shift while preserving dark/light polarity
- **Secondary outline (GitHub)** — background: #0000; text: #EDEDEE; border: 1px solid #FFFFFF12; radius: border-radius: var(--radius-md); padding: Small control padding suitable for top-nav action; hover: Slight surface fill to #101012 and border emphasis to #FFFFFF24

### Cards
Cards/panels are dark layered containers with thin low-contrast strokes, used for hero editor preview, how-it-works dual panel, and surfaces grid cells.
- Backgrounds: #101012 / #141418 / #1A1A20
- Border: #FFFFFF12 (default), #FFFFFF24 (strong)
- Radii: var(--radius-lg), var(--radius-xl), 3px/4px for micro-elements
- Separators: 1px lines and faint dashed rules using low-alpha neutrals

### Inputs
Email and prompt-like inputs sit on dark surfaces with clear border definition and muted placeholder text; often paired inline with a contrasting primary button.
- Input background: #0000 or dark surface layer
- Text: #EDEDEE / muted #EDEDEE99
- Border: #FFFFFF12
- Radius: border-radius 0 base reset, then var(--radius-md)/var(--radius-sm) utilities

### Navigation
Top nav is a horizontally distributed dark bar with section links, active lime underline, and right-aligned outline action button.
- Header background: #0A0A0B
- Link text: muted-to-foreground neutral
- Active indicator: #A3E635
- Dividers: 1px dashed/faint rules

### Image Treatment
No photography; visuals are interface simulations. Emphasis is on terminal/editor realism with syntax color coding and status metadata.
- Code accents: #60A5FA, #C084FC, #FBBF24, #F472B6, #A3E635
- Panel surfaces: #101012/#141418/#1A1A20
- Window dots: #FF5F56, #27C93F

### Distinctive
- **Editor artifact hero panel** — Tabbed dark editor mock featuring markdown sections, color token chips, and a streaming status bar to reinforce generated output.
- **How-it-works split simulation** — Left pseudo-app UI + right backend run log, both styled with mono syntax colors and measurable outputs (timings, sections, KB).
- **Five-surfaces grid with empty sixth cell** — Structured 3x2 grid where five cards are populated and one dim placeholder preserves system symmetry.

## 5. Layout Principles

### Spacing Scale
1px, 3px, 8px, 480px, 560px, 100vh (from extracted spacing tokens; includes utility and structural values).

### Grid
Centered max-width content with long-scroll stacked sections; key regions switch to two-column compositions (hero split, how-it-works split) and a 3x2 card grid for surfaces.

### Whitespace
Generous vertical section spacing separated by faint dashed horizontal rules; compact internal spacing in mock terminal/editor panels for dense technical content.

### Radius Scale
radius sm .25rem, radius md .375rem, radius lg .5rem, radius xl .75rem, border-radius 0, border-radius .25rem, border-radius 3px, border-radius 4px, border-radius 3.40282e38px, border-radius var(--radius-lg), border-radius var(--radius-md), border-radius var(--radius-sm), border-radius var(--radius-xl), border-bottom-right-radius var(--radius-sm), border-bottom-left-radius var(--radius-sm), border-radius 8px.

## 6. Depth & Elevation

### Levels
| Level | Use | Shadow |
| --- | --- | --- |
| Base plane | Global page canvas and major section backgrounds | `none` |
| Surface layering | Cards, panels, and nested mock app regions differentiated by tone not elevation blur | `none` |
| Interactive emphasis | Active states rely on color/border contrast, not drop shadows | `none` |

### Philosophy
Depth is intentionally flat and tonal; hierarchy comes from surface color steps, borders, and spacing rather than shadows.

## 7. Interaction & Motion

### Hover States
Link/button hover is conveyed through subtle border/surface contrast shifts and accent color emphasis (not shadow-driven). Active nav uses lime underline (#A3E635).

### Focus States
Form controls should use high-contrast border treatment against dark surfaces (base #FFFFFF12, stronger #FFFFFF24) while keeping text legible (#EDEDEE).

### Transitions
No explicit transition/animation duration or easing tokens were provided in the extracted CSS facts; do not assume timing values.

## 8. Responsive Behavior

### Breakpoints
| Name | Min width | Primary changes |
| --- | --- | --- |
| bp-1 | 40rem | Small-to-medium layout enhancement; increase horizontal structure and breathing room. |
| bp-2 | 48rem | Core two-column sections become stable (hero and how-it-works split behavior). |
| bp-3 | 64rem | Wider desktop composition with fuller grid expression and larger panel footprints. |
| bp-4 | 80rem | Max-width desktop refinement with sustained gutters and expanded negative space. |

### Touch Targets
Primary interactive targets (buttons, nav links, form controls) should maintain comfortably tappable heights via existing control padding and rounded tokens.

### Collapsing Strategy
Progress from multi-column desktop sections to stacked single-column flow while preserving section order: hero, how-it-works, surfaces, CTA.

### Image Behavior
Interface mock panels scale within container bounds; preserve legibility by prioritizing text contrast and panel border clarity over decorative scaling effects.

## 9. Agent Prompt Guide

### Quick Color Reference
```text
Background: #0A0A0B
Primary text: #EDEDEE
Muted text: #EDEDEE99
Primary accent: #A3E635
Border: #FFFFFF12
Strong border: #FFFFFF24
Surface steps: #101012 / #141418 / #1A1A20
Syntax: #60A5FA / #C084FC / #FBBF24 / #F472B6
```

### Example Prompts
- Build a dark developer-landing hero using #0A0A0B background, #EDEDEE headline, lime #A3E635 accent cursor, and a right-side editor mock panel.
- Create a two-panel 'How it works' section with a pseudo app UI on the left and backend log on the right, using mono syntax colors from the token set.
- Generate a 3x2 surfaces grid with five populated cards and one dim empty placeholder, borders in #FFFFFF12 and card surfaces in #101012/#141418.

### Iteration Guide
- Start with token fidelity: colors, radii, breakpoints, and typography values exactly as specified.
- Tune hierarchy next: oversized claim, muted supporting text, compact mono metadata.
- Add structural rhythm: dashed 1px separators and generous vertical spacing between major bands.
- Validate interaction styling remains flat (shadow: none) and stateful via accent/border contrast only.
