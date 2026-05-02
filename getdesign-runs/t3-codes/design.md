# T3 Code Design System

## 1. Visual Theme & Atmosphere

Dark, minimal, single-hero landing page focused on one conversion action.
Cinematic contrast strategy: bright headline and white CTA over near-black background.
Interface-first proof pattern: large product screenshot acts as the primary trust artifact.
Sparse navigation and reduced page chrome keep attention on headline → CTA → product image flow.

### Key Characteristics
- Near-black canvas (#09090B) with restrained grayscale typography.
- Center-aligned hero messaging with oversized type and generous vertical breathing room.
- Primary action uses high-contrast pill button (white fill) and subtle glow on hover.
- Secondary actions are intentionally muted and understated.
- Rounded screenshot container with faint border and mask fade creates soft depth.

## 2. Color Palette & Roles

Use a tightly limited monochrome system to maximize message clarity and product focus. Bright values are reserved for headline/CTA emphasis; mid and muted grays support secondary copy and UI chrome.

### Core dark/light contrast
| Hex | Role | Where seen |
| --- | --- | --- |
| `#09090B` | Primary page background | Body/hero canvas |
| `#FAFAFA` | Primary foreground text and CTA surface | Hero headline text; hero button background |
| `#A1A1AA` | Muted foreground text | Secondary copy such as low-emphasis links/metadata |
| `#71717A` | Dim foreground text | Top-right GitHub link and low-contrast supporting text |

### Borders, separators, and effects
| Hex | Role | Where seen |
| --- | --- | --- |
| `#FFFFFF0F` | Subtle border | Screenshot frame border |
| `#FFFFFF14` | Soft glow/shadow and border token | Hero button hover glow; root border token |
| `#71717A66` | Muted underline decoration | Secondary ‘Other platforms’ link underline |

### Masking/utility values
| Hex | Role | Where seen |
| --- | --- | --- |
| `#000` | Opaque mask stop | Screenshot fade mask gradient |
| `#0000` | Transparent mask stop | Screenshot fade mask gradient end |

### Notes
No saturated brand accent is required in page-level UI; color accents mostly live inside the embedded product screenshot image.

## 3. Typography Rules

DM Sans-led system stack with a single large responsive hero size and compact UI/link sizes. Weight contrast (400/500/600) does most of the hierarchy work.

### Hierarchy
| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Hero tagline | DM Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif | clamp(2rem,5vw,3.5rem) | 500 | 1.15 | -.035em |
| Body base | DM Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif | 16px | 400 | normal | normal |
| Button label | DM Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif | .9rem | 600 | normal | normal |
| Nav/supporting link | DM Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif | .875rem | 400 | normal | normal |
| Secondary CTA link | DM Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif | .825rem | 400 | normal | normal |
| Fine print/footer | DM Sans, -apple-system, BlinkMacSystemFont, system-ui, sans-serif | .8rem | 400 | normal | normal |

### Principles
- Keep hero copy to one concise line with maximum contrast.
- Use weight 600 sparingly for action labels; default to 400 for supporting UI text.
- Preserve tight hero tracking (-.035em) for the bold, modern brand voice.
- Rely on size and contrast instead of multiple font families.

## 4. Component Stylings

### Buttons
- **Primary hero pill** — background: #FAFAFA; text: #09090B; border: none explicit; hover effect uses glow token #FFFFFF14; radius: 999px; padding: Uses spacing tokens in context; icon size token is 1em; hover: box-shadow: 0 0 24px #ffffff14
- **Secondary text link button** — background: transparent; text: #A1A1AA; border: text underline #71717A66; radius: 0; padding: minimal text-only hit area; hover: Subtle emphasis via text/underline contrast (no explicit numeric transition token provided)

### Cards
Primary card-like surface is the product screenshot shell: large rounded dark panel with subtle border and fade mask treatment.
- border: 1px solid #FFFFFF0F
- border-radius: 16px
- mask-image gradient uses #000 to #0000

### Inputs
No standalone live form inputs are visible in the captured hero. Input-like controls appear only inside the static product screenshot image.
- No dedicated input tokenized styles found in provided CSS facts

### Navigation
Minimal top bar with left logo badge and right muted GitHub link; wide horizontal separation and low visual density.
- nav padding includes 1.5rem and 2.5rem
- logo mark uses 28px footprint with 6px radius
- link text uses .875rem size and dim/muted foreground treatment

### Image Treatment
Single oversized product screenshot centered below CTA, framed with subtle border and rounded corners, plus bottom fade via mask to blend into background.
- width: min(95vw,1400px) via 95vw token
- border-radius: 16px
- border: 1px solid #FFFFFF0F
- mask gradient #000 → #0000

### Distinctive
- **Single-action hero stack** — Headline, one primary download CTA, and one secondary platform link arranged in strict vertical center alignment.
- **Proof-first visual anchor** — Large, realistic app UI screenshot used as immediate credibility artifact instead of multi-section marketing blocks.
- **Ultra-minimal nav endpoints** — Only logo and GitHub link in header, reinforcing focused conversion intent.

## 5. Layout Principles

### Spacing Scale
1em, 1.25rem, 1.5rem, 2.5rem, 28px, 95vw, 100vh

### Grid
Centered hero column for text/CTA; full-width constrained media block using width: min(95vw, 1400px).

### Whitespace
Generous vertical spacing separates nav, hero headline, primary CTA, secondary link, and screenshot. The composition intentionally leaves large negative space around focal elements.

### Radius Scale
6px, 16px, 999px

## 6. Depth & Elevation

### Levels
| Level | Use | Shadow |
| --- | --- | --- |
| Base | Flat dark canvas foundation | `none` |
| Mid | Framed screenshot container separation | `1px border using #FFFFFF0F` |
| High | Interactive CTA emphasis on hover | `0 0 24px #ffffff14` |

### Philosophy
Depth is subtle and utility-driven: thin borders and soft glow cues replace heavy layered shadows.

## 7. Interaction & Motion

### Hover States
Primary hero button gains glow (box-shadow: 0 0 24px #ffffff14). Secondary text link relies on understated text-decoration styling.

### Focus States
No explicit focus-ring token is present in provided CSS facts; implement accessible default focus visibility consistent with contrast system.

### Transitions
No explicit transition-duration or easing token was provided in the supplied CSS facts/tokens.

## 8. Responsive Behavior

### Breakpoints
| Name | Min width | Primary changes |
| --- | --- | --- |
| base | 0px | No explicit breakpoint tokens provided; responsive behavior is achieved through fluid values (e.g., clamp typography and 95vw media width). |

### Touch Targets
Primary CTA is a large pill-style control; maintain comfortably tappable height. Icon uses 1em sizing inside button label.

### Collapsing Strategy
Keep the same single-column hero flow across sizes: nav endpoints on extremes, centered headline/CTA stack, then screenshot.

### Image Behavior
Screenshot container scales fluidly with width: min(95vw, 1400px) and maintains rounded frame/border treatment.

## 9. Agent Prompt Guide

### Quick Color Reference
```text
Background: #09090B
Primary foreground/surface: #FAFAFA
Muted text: #A1A1AA
Dim text: #71717A
Subtle border: #FFFFFF0F
Glow/border token: #FFFFFF14
Secondary underline: #71717A66
```

### Example Prompts
- Build a dark hero landing page matching T3 Code: background #09090B, centered headline in DM Sans at clamp(2rem,5vw,3.5rem) weight 500 line-height 1.15 letter-spacing -.035em, with a white pill CTA (radius 999px) and a muted underlined secondary link.
- Create a minimal top nav with only a left 28px logo badge (6px radius) and right .875rem muted link; below it, place a large screenshot container at width min(95vw,1400px), radius 16px, border 1px solid #FFFFFF0F, with subtle bottom mask fade (#000 to #0000).
- Style CTA hover with box-shadow 0 0 24px #ffffff14 and keep all other depth cues subtle; avoid colorful accents outside product imagery.

### Iteration Guide
- Start from monochrome contrast and spacing discipline before adding any decorative detail.
- Lock typography values exactly to tokens (especially clamp hero size and -.035em tracking).
- Keep component count minimal: nav, hero text, primary button, secondary link, screenshot.
- Use only provided radii (6px, 16px, 999px) and border/shadow tokens.
- If adding sections, preserve the same restrained tone and avoid introducing non-token colors.
