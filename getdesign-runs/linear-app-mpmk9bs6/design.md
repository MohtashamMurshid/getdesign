# Linear Design System

## 1. Visual Theme & Atmosphere

Dark-first, product-native aesthetic with near-black canvases and restrained chrome.
Long-form single-column storytelling built from repeated section modules (intro copy, framed product mockup, two-column sublinks).
Tone is technical, calm, and operational—high clarity, low ornament, minimal color outside functional accents.

### Key Characteristics
- Persistent sticky header with subtle divider and a single high-contrast pill CTA.
- Generous vertical spacing and low information density between modules; dense detail appears inside product mockups.
- Thin borders and faint separators (#23252A/#202122 family) define structure instead of filled panels.
- Monochrome-first palette with selective blue-violet accents for links/agents and semantic colors inside screenshots.
- Interface-led imagery (UI captures, code diffs, charts, agent panels) rather than photography.

## 2. Color Palette & Roles

Use a near-black base with layered dark surfaces, bright but controlled foreground text, and sparse accent color reserved for interaction and status emphasis.

### Core dark foundations
| Hex | Role | Where seen |
| --- | --- | --- |
| `#08090A` | Primary page background / bg level 0 | Global canvas, hero, major sections |
| `#0F1011` | Panel background / bg level 1 | Framed UI areas, cards, overlays |
| `#141516` | Deeper elevated surface / bg level 2 | Nested dark containers |
| `#090A0B` | Frame interior background | Large showcase mockup frames |
| `#101012` | Card background token | Feature card surfaces |

### Text and neutral foreground
| Hex | Role | Where seen |
| --- | --- | --- |
| `#F7F8F8` | Primary text | Hero/section headings and key labels |
| `#FFF` | High-contrast text and CTA fill | Wordmark, bright text, Sign up button |
| `#8A8F98` | Tertiary text | Body copy, supporting descriptions |
| `#62666D` | Quaternary text | Section indices, muted meta labels |

### Accent and interactive
| Hex | Role | Where seen |
| --- | --- | --- |
| `#828FFF` | Primary link accent | Inline links, subtle highlight actions |
| `#7170FF` | Accent/agent emphasis | Agent-related UI emphasis |
| `#5E6AD2` | Brand accent background | Focus/brand ring contexts |
| `#02B8CC` | Data viz accent | Monitor chart bars and analytic highlights |

### Borders and separators
| Hex | Role | Where seen |
| --- | --- | --- |
| `#23252A` | Primary border | Global dividers and container outlines |
| `#202122` | Top border separator | Section boundary lines |
| `#383B3F` | Shine/frame border | Mockup framing and card outlines |
| `#24282C` | Thin border variant | Fine UI separators |
| `#191D21` | Faint thin border | Subtle frame internals |
| `#151616` | Frame border | Large showcased screenshots |

### Notes
All listed hex values are sourced from provided token colors.

## 3. Typography Rules

Primary typography uses Inter Variable for UI/content and Berkeley Mono for code/technical contexts. Hierarchy relies on weight and contrast more than dramatic size jumps in base CSS tokens.

### Hierarchy
| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Body (root) | Inter Variable | 100% | var(--font-weight-normal) | normal | normal |
| Body (default) | Inter Variable | 16px | 400 | normal | normal |
| Heading reset (h1-h6) | Inter Variable | 1rem | var(--font-weight-semibold) | normal | normal |
| Body compact | Inter Variable | .9375em | 400 | normal | normal |
| Body small | Inter Variable | .875rem | 400 | normal | normal |
| Body x-small | Inter Variable | .8125rem | 400 | normal | normal |
| Body micro | Inter Variable | .75rem | 400 | normal | normal |
| Utility keycap | Inter Variable | .8em | var(--font-weight-medium) | normal | normal |
| Mono default | Berkeley Mono | 16px | 400 | normal | normal |
| Mono inline | Berkeley Mono | .875em | 400 | 1.3 | normal |
| Small pre | Berkeley Mono | 14px | 400 | 1.5 | normal |

### Principles
- Keep text left-aligned and hierarchy-driven via contrast (primary vs tertiary/quaternary).
- Use mono only for code, terminal, diffs, and technical snippets.
- Maintain concise line lengths in section intros; large statements are broken into short lines for scanability.

## 4. Component Stylings

### Buttons
- **Primary pill (header Sign up)** — background: #FFF; text: #000; border: none or minimal dark-edge contrast against header; radius: var(--button-corner-radius) with button corner radius=var(--radius-rounded); padding: Compact horizontal pill padding; height aligns to header rhythm; hover: Subtle visual state shift; no heavy shadow emphasis
- **Ghost/Text nav action (Log in / links)** — background: transparent; text: #8A8F98 to #F7F8F8 emphasis; border: none; radius: var(--button-corner-radius); padding: Low-padding inline action; hover: Text color increases toward #FFF

### Cards
Dark cards with thin 1px outlines and soft corner radii; used for feature trio and floating UI overlays.
- background: #101012 / #0F1011
- border: 1px solid #383B3F or 1px solid #23252A
- radius: var(--app-radius) (12px), var(--radius-12), var(--radius-8), var(--radius-6) depending component

### Inputs
Inputs/composers are dark, low-contrast framed fields with muted placeholder text and occasional accent action button.
- line-height: 21px
- border: 1px solid #323334 / #23252A contextually
- radius: var(--control-border-radius,4px), 6px, 8px, or 12px depending context

### Navigation
Sticky top navigation on dark backdrop with subtle bottom divider; right-aligned auth actions and prominent pill CTA.
- header height: 72px
- separator: 1px lines using border tokens (e.g., #202122 / #23252A)
- active/hover text shifts from muted neutral to #FFF

### Image Treatment
Product mockups are framed dark panels with rounded corners, thin borders, and restrained glow/shadow; layered overlays create depth.
- frame bg: #090A0B / #0F1011
- frame border: #151616 / #191D21 / #24282C
- radius: var(--app-radius)=12px, calc(var(--app-radius) - 4px), 24px in select shells

### Distinctive
- **Numbered capability sections** — Repeating pattern of “N.0 Label →” intro + large UI demo + two-column subfeature index.
- **Two-column subfeature link rail** — Section footers split links into mirrored columns with a faint vertical divider.
- **Dark diff and agent overlays** — High-density code/agent UI embedded in otherwise spacious marketing layout, reinforcing product-first credibility.

## 5. Layout Principles

### Spacing Scale
Token-driven spacing includes core positive steps 1px, 2px, 3px, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px, 36px, 40px, 46px, 48px, 50px, 56px, 64px, 72px, 96px, 128px, 160px; plus negative/offset utilities including -4px, -6px, -8px, -12px, -16px, -20px, -24px, -28px, -32px, -40px, -56px, -300px, -50vw, -9999px, -0.5em.

### Grid
Centered content container with consistent left gutter; desktop sections read as single-column stacks with internal 2-column link splits and occasional 3-column card grids.

### Whitespace
Large vertical gaps separate major story bands; sparse chrome and generous breathing room around section intros and framed mockups.

### Radius Scale
Distinct radii include 0, 1px, 2px, 3px, 4px, 5px, 6px, 7px, 8px, 10px, 12px, 14px, 16px, 20px, 22px, 24px, 32px, 72px, 400px, 999px, 9999px, 50%, 100%, .2em, .3em, clamp(4px,1cqw,8px), calc(var(--editor-block-radius) - 2px), calc(var(--app-radius) - 4px), and token aliases like var(--radius-4/6/8/12/16/24/32), var(--radius-rounded), var(--radius-circle), var(--button-corner-radius), var(--app-radius), var(--radius-full).

## 6. Depth & Elevation

### Levels
| Level | Use | Shadow |
| --- | --- | --- |
| Base | Main page background and section bands | `0px 0px 0px transparent` |
| Low | Subtle panel lift and minor controls | `0px 2px 4px rgba(0,0,0,0.1)` |
| Medium | Toasts/dialog-like elements | `0px 4px 24px rgba(0,0,0,0.2)` |
| High | Dropdowns/overlays and prominent floating panels | `0px 7px 32px rgba(0,0,0,0.35)` |

### Philosophy
Depth is restrained and mostly structural: thin borders + soft dark shadows; avoid bright, floating card aesthetics.

## 7. Interaction & Motion

### Hover States
Primary interaction signal is color/contrast shift (muted neutral to brighter text) and subtle overlay emphasis, not aggressive motion.

### Focus States
Accessible focus treatment includes layered ring pattern: 0 0 0 2px var(--color-bg-primary),0 0 0 4px var(--color-brand-bg).

### Transitions
No deterministic transition-duration/easing token was provided in the supplied CSS facts digest; do not invent timing values.

## 8. Responsive Behavior

### Breakpoints
| Name | Min width | Primary changes |
| --- | --- | --- |
| bp-1 | 641px | Initial layout expansion; increased horizontal breathing room. |
| bp-2 | 769px | Stronger desktop navigation rhythm; larger framed media presentation. |
| bp-3 | 1025px | Full desktop composition with wide hero, 3-up feature cards, and expanded section mockups. |
| bp-4 | 1281px | Container width growth with more negative space and wider mockup framing. |
| bp-5 | 1536px | Large-screen scaling of long-form sections while preserving centered content structure. |

### Touch Targets
Interactive controls commonly align to substantial control heights (e.g., 44px/56px/62px tokens appear in system), with pill actions used for high-priority CTAs.

### Collapsing Strategy
Progressively reduce multi-column elements into simpler stacked flows while preserving section order: intro text → mockup → sublinks.

### Image Behavior
Large product mockups remain dominant and scale within container bounds (e.g., width constraints like min(720px,100%) and max-width systems), preserving rounded frame treatment.

## 9. Agent Prompt Guide

### Quick Color Reference
```text
Background: #08090A
Panel: #0F1011
Primary text: #F7F8F8 / #FFF
Secondary text: #8A8F98
Muted text: #62666D
Primary accent: #828FFF
Brand accent: #5E6AD2
Border: #23252A / #202122
```

### Example Prompts
- Build a dark landing section in Linear style: #08090A background, #F7F8F8 heading, #8A8F98 body, thin 1px #23252A separators, and a rounded framed mockup panel using 12px radius.
- Create a sticky 72px header with left logo, muted nav links, and a right white pill CTA using radius var(--radius-rounded).
- Generate a two-column subfeature link footer under a section with muted labels (#62666D), subtle divider, and generous vertical spacing.

### Iteration Guide
- Start with structure first: sticky header, section cadence, and separators.
- Apply palette conservatively; keep bright accents limited to links/CTA/status.
- Use Inter Variable for all prose/UI and Berkeley Mono only in code-like regions.
- Keep borders thin and shadows soft; avoid glossy gradients except subtle dark glows.
- Validate breakpoints exactly at 641px, 769px, 1025px, 1281px, 1536px.
