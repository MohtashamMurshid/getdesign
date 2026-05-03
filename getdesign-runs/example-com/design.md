# Example Domain Design System

## 1. Visual Theme & Atmosphere

Ultra-minimal, utility-first presentation with a single left-aligned text block on a flat background.
Asymmetric composition: content sits in the upper-left region with extensive negative space to the right and below.
No ornamental UI layers (no cards, separators, imagery, or iconography); hierarchy is purely typographic plus one conventional link treatment.

### Key Characteristics
- Sparse single-column reading flow (H1 → paragraph → text link).
- Quiet, informational tone with restrained visual contrast.
- Flat, borderless interface style with no elevation tokens.
- Default web affordance styling for links (blue, underlined) as the only interactive cue.
- Monochrome-neutral surface punctuated by one accent color for action.

## 2. Color Palette & Roles

A deliberately constrained palette: one neutral page surface and one link accent color. The system relies on whitespace and type hierarchy rather than color variety.

### Surfaces
| Hex | Role | Where seen |
| --- | --- | --- |
| `#EEE` | Page background | Full-viewport body background |

### Interactive Accent
| Hex | Role | Where seen |
| --- | --- | --- |
| `#348` | Link text color (default/visited) | "Learn more" anchor |

### Notes
Only colors present in tokens are defined. Text foreground colors used by user-agent defaults are not tokenized in the provided extraction.

## 3. Typography Rules

Typography is system-native and functional: `system-ui, sans-serif` on body, with a compact two-step scale from CSS (`Body 16px`, `H1 1.5em`).

### Hierarchy
| Role | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| Body | system-ui, sans-serif | 16px | 400 | normal | normal |
| H1 | system-ui, sans-serif | 1.5em | 400 | normal | normal |

### Principles
- Use native/system rendering for a neutral, fast-loading presentation.
- Keep hierarchy shallow: one headline level and one body size are sufficient for this page pattern.
- Preserve default readability behavior (\`line-height: normal\`) and avoid decorative letterspacing.

## 4. Component Stylings

### Buttons
- **None present** — background: none; text: n/a; border: none; radius: none; padding: n/a; hover: n/a

### Cards
No card components are used; content is rendered directly on the page background.
- No surface container token beyond body background #EEE
- No border token
- No shadow token

### Inputs
No form inputs are present on the page.
- No input background token
- No input border/radius token
- No input focus token

### Navigation
No dedicated navigation/header component; the page is a single informational content block.
- No nav container token
- No menu/link-group token beyond single inline anchor

### Image Treatment
No images, illustrations, icons, or decorative media are present.
- No image ratio/crop rules
- No overlays/filters
- No media shadows or frames

### Distinctive
- **Single informational content cluster** — A compact, upper-left text stack with large surrounding whitespace acts as the entire experience.
- **Conventional text-link affordance** — Interactivity is expressed solely through the blue underlined inline link (\`#348\`).

## 5. Layout Principles

### Spacing Scale
No spacing tokens were extracted (`tokens.spacing` is empty). Layout spacing is therefore implementation/default-flow driven rather than tokenized.

### Grid
No explicit grid system is defined in extracted tokens; composition behaves like a simple document flow block placed with page-level offsets.

### Whitespace
Whitespace is the dominant structural device: substantial empty canvas around a narrow text column creates focus and calm.

### Radius Scale
No radius tokens were extracted (`tokens.radii` is empty).

## 6. Depth & Elevation

### Levels
| Level | Use | Shadow |
| --- | --- | --- |
| Flat | Entire interface (background + text + link) | `none` |

### Philosophy
No shadows or elevation layers are used; depth is intentionally absent to keep the page purely informational.

## 7. Interaction & Motion

### Hover States
No explicit hover styles were extracted; link interaction appears to rely on default browser anchor behavior.

### Focus States
No explicit focus styles were extracted; focus behavior is browser default.

### Transitions
No transition or animation tokens were found in the extracted CSS.

## 8. Responsive Behavior

### Breakpoints
| Name | Min width | Primary changes |
| --- | --- | --- |
| Default (no defined breakpoints) | 0px | No tokenized media-query breakpoints were extracted; layout remains a simple document flow that naturally reflows with viewport width. |

### Touch Targets
Only an inline text link is present; no additional touch-target sizing tokens are defined.

### Collapsing Strategy
No component collapse patterns are required due to single-column, low-density content.

### Image Behavior
Not applicable; no images are present.

## 9. Agent Prompt Guide

### Quick Color Reference
```text
Background: #EEE
Interactive link accent: #348
Do not introduce additional hex colors unless sourced from new tokens.
Text foreground defaults are UA/system-derived and were not tokenized.
Use flat styling (no shadows, no gradients).
Maintain minimalist, high-whitespace composition.
```

### Example Prompts
- Build a one-screen informational page with body background #EEE, system-ui/sans-serif typography, H1 at 1.5em (400), body at 16px (400), and one underlined link colored #348.
- Recreate the Example Domain layout as a sparse upper-left text stack with extensive empty space, no header/nav, no cards, no buttons, and no shadows.
- Generate semantic HTML for a minimal notice page: h1, paragraph, and a single anchor (\`a:link,a:visited { color: #348 }\`) on #EEE background.

### Iteration Guide
- Start with token-locked foundations only: colors (#EEE, #348), typography (16px body, 1.5em H1, weight 400, line-height normal, letter-spacing normal).
- Do not add non-tokenized visual effects (extra colors, radii, shadows, transitions, or breakpoints).
- If extending the page, preserve the same minimalist voice: text-first, low component count, high whitespace.
- For accessibility improvements, adjust structure/semantics first (landmarks, link clarity) before introducing new visual tokens.
- Any new design variation should remain flat and restrained unless new CSS tokens are explicitly provided.
