# `design.md` — 9-Section Template

This is the exact schema the `getdesign` skill must produce. Follow it field-for-field. Section headings are H2 and must appear in this order.

---

## 1. Visual Theme & Atmosphere

- Opening paragraph: one sentence on overall mood + one sentence on target audience / product category.
- Second paragraph: the dominant design language (e.g. "minimalist monochrome with a single vivid accent", "maximalist editorial", "warm neumorphic").
- `### Key Characteristics` — bullet list of 5–8 items, each a short phrase describing a distinctive trait (e.g. "Asymmetric hero with generous left-padded whitespace", "Thin 1px borders replace shadows as the primary separator").

## 2. Color Palette & Roles

Lead with 1–2 sentences on the palette philosophy (mono vs duotone vs multi-accent, light/dark posture).

Then, for each color group present, output a table:

```markdown
### Primary
| Hex       | Role          | Where seen                      |
| --------- | ------------- | ------------------------------- |
| `#0A0A0A` | Surface base  | `body`, `:root --bg`            |
| `#FAFAFA` | Surface raised| `.card`, `main`                 |
```

Groups to emit when present: `Primary`, `Accent`, `Semantic` (success / warning / error / info), `Surfaces`, `Borders`, `Shadows` (hex w/ alpha OK).

Close with a `### Notes` paragraph on how colors are combined (e.g. "Accent is used only for primary CTAs and active nav states; never for body copy").

## 3. Typography Rules

- Opening: the font stack summary, e.g. "Display: `Geist`, Body: `Inter`, Mono: `Berkeley Mono`. All loaded via `@font-face` from `/fonts/`."
- `### Hierarchy` — table:

```markdown
| Role    | Font   | Size         | Weight | Line height | Letter spacing |
| ------- | ------ | ------------ | ------ | ----------- | --------------- |
| Display | Geist  | 72px / 5rem  | 600    | 1.05        | -0.02em         |
| H1      | Geist  | 48px         | 600    | 1.1         | -0.015em        |
| H2      | Geist  | 32px         | 600    | 1.15        | -0.01em         |
| H3      | Inter  | 20px         | 600    | 1.3         | 0               |
| Body    | Inter  | 16px         | 400    | 1.6         | 0               |
| Small   | Inter  | 13px         | 500    | 1.4         | 0.01em          |
| Mono    | Berkeley Mono | 14px  | 400    | 1.5         | 0               |
```

- `### Principles` — 3–6 bullets on the type system (e.g. "Tight negative letter-spacing on all 20px+ display sizes", "Body never exceeds 65ch measure").

## 4. Component Stylings

One `###` subsection per component family. Always include:

- **Buttons** — primary / secondary / ghost / destructive. For each: background, text color, border, radius, padding, hover shift.
- **Cards** — surface, border, radius, padding, shadow (or lack thereof).
- **Inputs** — background, border, focus ring color + width, radius, placeholder color.
- **Navigation** — desktop header structure, mobile collapse mechanism, active-state treatment.
- **Image Treatment** — radius, aspect ratios used, any overlay / gradient treatment.
- **Distinctive** — 2–4 components unique to this brand (e.g. "Metric tile with animated number count-up", "Docs sidebar with 2px left-rail active indicator").

Use concrete values. Prefer `CSS-var: value` notation where a variable is in play.

## 5. Layout Principles

- `### Spacing Scale` — the numeric ramp actually in use, e.g. `4, 8, 12, 16, 24, 32, 48, 64, 96px`. Mention the unit system (4px / 8px base, or `rem`).
- `### Grid` — max content width, column behavior (12-col? 6-col? single column with max-width?), gutter.
- `### Whitespace` — 2–3 sentences on density philosophy.
- `### Radius Scale` — named ramp, e.g. `sm 6px, md 10px, lg 16px, pill 999px`.

## 6. Depth & Elevation

`### Levels` — table of named elevations and their `box-shadow` values:

```markdown
| Level | Use              | Shadow                                   |
| ----- | ---------------- | ---------------------------------------- |
| 0     | Flat surfaces    | none                                     |
| 1     | Resting cards    | `0 1px 2px rgba(0,0,0,0.06)`             |
| 2     | Hover / dropdown | `0 4px 12px rgba(0,0,0,0.08)`            |
| 3     | Modals / popovers| `0 16px 48px rgba(0,0,0,0.16)`           |
```

`### Philosophy` — one paragraph. Typical answers: "Depth is achieved through 1px borders on dark surfaces rather than shadows" or "Shadows are soft, warm-tinted, and only used at hover/overlay layers".

## 7. Interaction & Motion

- `### Hover States` — describe for buttons, links, cards, nav items. Mention opacity / color / transform patterns.
- `### Focus States` — ring color, ring width, offset. Accessibility note on visible focus.
- `### Transitions` — durations and easings actually found in CSS (`150ms ease-out`, `cubic-bezier(0.4, 0, 0.2, 1)`). State which properties animate (colors, transforms, opacity).

If any value is inferred rather than read from CSS, mark it `(inferred)`.

## 8. Responsive Behavior

- `### Breakpoints` — table from `@media (min-width: …)` queries:

```markdown
| Name | Min width | Primary changes                      |
| ---- | --------- | ------------------------------------ |
| sm   | 640px     | single-col → 2-col card grid         |
| md   | 768px     | nav: hamburger → horizontal          |
| lg   | 1024px    | sidebar appears                      |
| xl   | 1280px    | max-width container locks at 1200px  |
```

- `### Touch Targets` — minimum tappable size on mobile.
- `### Collapsing Strategy` — how navigation and dense components collapse on narrow viewports.
- `### Image Behavior` — object-fit strategy, art-direction with `picture`/`srcset` if observed.

## 9. Agent Prompt Guide

A section designed to be fed back into other AI coding tools.

- `### Quick Color Reference` — fenced code block with 6–12 hexes, each annotated:

```text
#0A0A0A  // surface-base
#FAFAFA  // surface-raised
#2563EB  // accent / primary CTA
#10B981  // semantic.success
#EF4444  // semantic.error
#E5E7EB  // border-subtle
```

- `### Example Prompts` — 3 short prompts another AI could paste into a coding tool to replicate this style. Each prompt should reference concrete tokens from sections 2–4.

- `### Iteration Guide` — 4–6 bullets telling a downstream agent how to tweak the system without breaking it (e.g. "To add a warm variant, rotate accent hue by +30° but keep saturation under 65% to preserve the muted feel").

---

## Worked mini-example (truncated)

```markdown
# Linear Design System

## 1. Visual Theme & Atmosphere

Dark-first, editorial-minimalist. The product voice is calm and technical; the landing
page mirrors that with deep violet surfaces, tight type, and near-zero shadows.

### Key Characteristics
- Monochrome violet surface ramp with a single electric accent for CTAs
- 1px hairline borders replace elevation almost everywhere
- Oversized Inter Display hero at 80px with -0.02em tracking
- Consistent 8px grid; no off-grid padding anywhere
- Iconography is thin (1.5px stroke), never filled

## 2. Color Palette & Roles
...

## 9. Agent Prompt Guide
### Quick Color Reference
```
```text
#08090A  // surface.base
#16171B  // surface.raised
#5E6AD2  // accent.primary
#E5E5E5  // text.primary
#95979D  // text.secondary
#26282C  // border.subtle
```
```

Use this template verbatim for structure. The prose is yours; the scaffolding is not negotiable.
