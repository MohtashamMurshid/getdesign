# getdesign Design System

## 1. Visual Theme & Atmosphere

Dark, code-native hero page with a single conversion goal (waitlist signup).
Split composition: oversized marketing typography on the left, editor-style mock panel on the right.
Minimal, technical, and high-contrast atmosphere with sparse neon-lime signaling.
Page behaves as one persistent hero surface rather than a multi-section narrative.

### Key Characteristics
- Near-black canvas (#0A0A0B) with restrained layered surfaces (#101012, #141418, #1A1A20).
- Large sans headline in light foreground (#EDEDEE), ending with lime accent punctuation (#A3E635).
- Subtle structure via thin/dashed separators and low-contrast borders (#FFFFFF12 / #FFFFFF24).
- UI metaphor is terminal/editor-first: tabs, markdown content, mono code styling, streaming status dot.
- Accent discipline: lime used for status/action cues; syntax colors (blue/purple/pink/yellow) mostly contained to code panel.

## 2. Color Palette & Roles

Use a dominant dark foundation with soft neutral text and very selective lime accents. Keep high readability and technical tone; reserve vivid syntax colors for code/editor contexts.

### Core dark surfaces
| Hex | Role | Where seen |
| --- | --- | --- |
| `#0A0A0B` | App background / primary dark | Full page background, dark controls, overall canvas |
| `#101012` | Surface 100 | Panel and control fills (subtle elevation from page bg) |
| `#141418` | Surface 200 | Tab/header strips inside editor mockup |
| `#1A1A20` | Surface 300 | Active tab/chip-like dark layers |

### Text neutrals
| Hex | Role | Where seen |
| --- | --- | --- |
| `#EDEDEE` | Primary foreground text | Main headline, key labels, high-emphasis UI text |
| `#EDEDEE99` | Muted text | Body paragraph, disclaimer, secondary nav/editor text |
| `#EDEDEE61` | Subtle text/lines | Low-priority metadata and subdued UI markings |
| `#EDEDEE1F` | Faint overlays | Very soft separators and understated fills |

### Accent and status
| Hex | Role | Where seen |
| --- | --- | --- |
| `#A3E635` | Primary accent | Headline period, waitlist/status dots, prompt glyph, streaming indicator |
| `#65A30D` | Dim accent | Reduced-emphasis green states and secondary accent moments |
| `#A3E6352E` | Accent glow | Soft glow/halo around lime status treatments |
| `#27C93F` | Live/status green | Editor status-dot style indicator |

### Syntax/editor highlight colors
| Hex | Role | Where seen |
| --- | --- | --- |
| `#60A5FA` | Info/code heading blue | Markdown section headers in editor panel |
| `#C084FC` | Keyword purple | Code token highlighting |
| `#F472B6` | Variable pink | Code token highlighting |
| `#FBBF24` | Numeric/warm token | Code token highlighting |

### Utility and feedback
| Hex | Role | Where seen |
| --- | --- | --- |
| `#FFFFFF12` | Default border | Input, card, button outlines and separators |
| `#FFFFFF24` | Strong border | Higher-emphasis strokes (focused/important boundaries) |
| `#F87171` | Danger/error | Validation or destructive semantic text |
| `#FF5F56` | Window-control red accent | Decorative editor chrome dot |
| `#0A0A0BB3` | Dark text at 70% | Text on light button surfaces |
| `#0000` | Transparent | Base transparent backgrounds/borders |

### Notes
Keep the light CTA button style using #EDEDEE background with dark text (#0A0A0B) to create one strong contrast target on the hero.

## 3. Typography Rules

Primary voice is Geist (modern sans) for marketing/UI, paired with JetBrains Mono for code/editor regions. Hierarchy is driven by extreme scale contrast: very large hero display vs compact utility labels.

### Hierarchy
| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Hero display | Geist, ui-sans-serif, system-ui | ~80–100px (responsive clamp behavior implied) | 700–800 | ~0.95–1.05 | slightly tight |
| Body lead paragraph | Geist, ui-sans-serif, system-ui | ~20–24px visual appearance | 400 | ~1.5 | normal |
| Navigation / small UI labels | Geist, ui-sans-serif, system-ui | ~14–16px | 400–500 | normal | slight tracking for uppercase nav |
| Micro text | Geist, ui-sans-serif, system-ui | 9px / 9.5px / 10px / 10.5px | 400 | normal | normal |
| Code/editor content | JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace | ~14–16px | 400 | ~1.5 | normal |

### Principles
- Use sans for all product messaging and navigation; mono is reserved for code artifact framing.
- Preserve strong contrast: #EDEDEE text on #0A0A0B; muted variants for supporting copy.
- Maintain pronounced size jumps between headline, body, and utility text.
- Avoid decorative type effects; clarity and technical precision over personality flourishes.

## 4. Component Stylings

### Buttons
- **Primary CTA (Join waitlist)** — background: #EDEDEE; text: #0A0A0B; border: 1px solid #FFFFFF24 (or minimal border); radius: ~8px to 12px (rounded-md/xl feel); padding: Compact vertical, medium horizontal; sized to align with input row height; hover: Slight brightness/contrast drop and subtle border emphasis
- **Secondary outline (GitHub)** — background: #0A0A0B; text: #EDEDEE; border: 1px solid #FFFFFF12; radius: ~8px; padding: Small-medium, icon + label inline; hover: Border strengthens toward #FFFFFF24; background lifts toward #101012

### Cards
Editor mock card is the key visual container: dark elevated surface with rounded corners, top tab strip, scrollable mono body, and bottom status bar.
- Background layers: #101012 / #141418 / #1A1A20
- Border: #FFFFFF12
- Radius: var(--radius-xl)
- Text mix: #EDEDEE, #EDEDEE99, syntax colors (#60A5FA, #A3E635, #C084FC, #F472B6, #FBBF24)

### Inputs
Email capture is a single elongated bordered container combining prompt glyph, text input, and embedded submit button.
- Container bg: #0A0A0B
- Border: #FFFFFF12
- Prompt/accent glyph: #A3E635
- Placeholder/muted text: #EDEDEE99
- Inner CTA: #EDEDEE bg with #0A0A0B text
- Radius: rounded-lg/xl

### Navigation
Top horizontal bar with left logo lockup, centered uppercase links, right outline button; separated from hero by faint dashed rule.
- Nav text: #EDEDEE and #EDEDEE99
- Background: #0A0A0B
- Divider: faint/subtle line using #EDEDEE1F or border token
- Spacing: generous horizontal gaps, compact vertical height

### Image Treatment
No photography; illustration is entirely UI-native. The right panel acts as product proof through realistic editor chrome and syntax-colored content.
- No image filters/overlays
- Use crisp 1px strokes (#FFFFFF12)
- Status dots and syntax colors as visual texture

### Distinctive
- **Lime terminal punctuation** — Headline ends with a single #A3E635 period, acting as brand signature and focal accent.
- **Persistent streaming motif** — Bottom-right green dot + 'streaming' in editor panel reinforces live generation behavior.
- **Dashed structural divider** — Subtle dashed line under header adds technical grid rhythm without introducing full section blocks.

## 5. Layout Principles

### Spacing Scale
Compact token set with tight UI spacing (1px, 3px, 8px) plus large hero gaps; macro rhythm is spacious while controls stay dense.

### Grid
Desktop-first two-column hero: left ~45–50% content column, right ~50–55% editor card; max text measure around 560px.

### Whitespace
Heavy negative space around the hero block and below content; no additional dense sections visible across captured height.

### Radius Scale
System radii from .25rem/.375rem/.5rem/.75rem, with rounded-full for pills; most visible controls sit in md–xl range.

## 6. Depth & Elevation

### Levels
| Level | Use | Shadow |
| --- | --- | --- |
| Base | Page canvas and most background | `none` |
| Raised surface | Editor card and grouped controls via tonal layering | `none` |
| Interactive emphasis | Buttons, active tabs, and bordered form row through contrast not blur | `none` |

### Philosophy
Depth is achieved by luminance steps and border contrast, not shadows. Keep a flat, precise developer-tool aesthetic.

## 7. Interaction & Motion

### Hover States
Links and outline controls shift from muted to brighter foreground; borders strengthen from #FFFFFF12 toward #FFFFFF24. Primary light button slightly dims on hover to confirm clickability.

### Focus States
Inputs/buttons should use a clear high-contrast focus ring or stronger border (accent-friendly). Preserve keyboard-visible outlines, especially inside the combined email row.

### Transitions
Short, subtle transitions (~120–180ms ease) on color, border-color, and background-color only; avoid movement-heavy animation.

## 8. Responsive Behavior

### Breakpoints
| Name | Min width | Primary changes |
| --- | --- | --- |
| bp-1 | 40rem | Improve horizontal spacing and stabilize nav/link distribution. |
| bp-2 | 48rem | Scale headline and paragraph; maintain readable measure for left column. |
| bp-3 | 64rem | Activate full two-column hero with large editor panel on right. |
| bp-4 | 80rem | Increase canvas breathing room while keeping content anchored and not overly stretched. |

### Touch Targets
Keep interactive elements at least ~40px tall in compact mode; maintain clear separation between nav links and buttons.

### Collapsing Strategy
On smaller widths, stack hero columns vertically (left content first, editor panel second), retain single primary CTA row, and simplify nav spacing.

### Image Behavior
Editor mock scales proportionally within container, preserving rounded frame and tab/status bars; avoid cropping key status/tab labels.

## 9. Agent Prompt Guide

### Quick Color Reference
```text
Background: #0A0A0B
Primary text: #EDEDEE
Muted text: #EDEDEE99
Primary accent: #A3E635
Border: #FFFFFF12
Panel surfaces: #101012 / #141418 / #1A1A20
Code blue: #60A5FA
```

### Example Prompts
- Build a dark SaaS hero for getdesign with a left marketing column and right editor mock card, using #0A0A0B background and #A3E635 as sparse accent.
- Create a waitlist form row that merges input and CTA in one rounded bordered container; input dark, button light (#EDEDEE) with dark text (#0A0A0B).
- Style a code preview panel with tab header, mono body text, syntax colors (#60A5FA, #C084FC, #F472B6, #FBBF24, #A3E635), and a 'streaming' status dot.

### Iteration Guide
- Start by matching macro layout and contrast before adding syntax/detail colors.
- Validate accent restraint: lime appears only on key cues, not as broad fills.
- Keep borders subtle and consistent (mostly 1px #FFFFFF12).
- Preserve typography hierarchy: oversized headline, moderate body, tiny utility/meta text.
- If redesigning responsive behavior, retain single-goal hero and editor-as-proof structure.
