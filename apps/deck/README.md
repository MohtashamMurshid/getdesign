# deck

Launch deck for **getdesign** — 8 slides for the open-source dev-tool launch.

Built directly from the design system in [`apps/web/app/design`](../web/app/design): same tokens (`#0a0a0b` canvas, `#a3e635` lime accent, `#101012` surfaces), same dashed hairline rails, same `01·02·03…` mono section grammar, same Geist + JetBrains Mono pairing.

## Structure

```
deck/
├── index.html                    # live HTML deck — open in a browser, ←/→ to navigate
├── slides/                       # 8 self-contained 960×540pt source files
│   ├── 01-cover.html             # The design system for any URL.
│   ├── 02-problem.html           # Matching a brand is a manual, lossy ritual.
│   ├── 03-solution.html          # Paste a URL. Get a design.md.
│   ├── 04-sections.html          # Nine sections, in this order, every time.
│   ├── 05-pipeline.html          # Four phases. About ninety seconds.
│   ├── 06-grounded.html          # Every color appears in the actual stylesheet.
│   ├── 07-surfaces.html          # Four surfaces. One agent core.
│   └── 08-cta.html               # Open-source. Available today.
├── exports/
│   ├── getdesign-deck.pdf        # vector PDF · text searchable
│   └── getdesign-deck.pptx       # editable PPTX · double-click any text in PowerPoint
└── scripts/
    ├── export_deck_pdf.mjs       # build:pdf — Playwright + pdf-lib
    ├── export_deck_pptx.mjs      # build:pptx — pptxgenjs + html2pptx
    └── html2pptx.cjs             # DOM → PowerPoint object translator
```

## Usage

```bash
# from this directory
bun install

# preview live (browser, keyboard navigation)
bun run preview        # http://localhost:4321

# rebuild artefacts after editing slides/
bun run build          # both PDF + PPTX
bun run build:pdf      # vector PDF only
bun run build:pptx     # editable PPTX only
```

## Editing slides

Each `slides/NN-*.html` is a fully self-contained 960pt × 540pt document (matches PowerPoint's `LAYOUT_WIDE`, 13.333″ × 7.5″). Edit any of them, then rerun `bun run build` to regenerate the PDF and PPTX from the same source.

### PPTX hard constraints (already honored, keep when editing)

The `.pptx` exporter (`html2pptx.js`) translates HTML DOM into native PowerPoint objects so text stays editable. It enforces four rules:

1. **All text lives in `<p>` or `<h1>`–`<h6>`** — never bare in a `<div>` or `<span>`.
2. **No CSS gradients** — solid colors only. Use stacked elements for stripes.
3. **Backgrounds, borders, shadows belong on `<div>`s** — never on `<p>` or `<h*>`.
4. **No `background-image` on `<div>`** — use `<img>` instead.

Break any of these and the PPTX export will fail with a precise error pointing at the offending element. The PDF export and live HTML are unaffected — only PPTX is strict.

### Design tokens (from `apps/web/app/design`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0a0a0b` | Page canvas |
| `--surface-100` | `#101012` | Cards |
| `--surface-200` | `#141418` | Inputs, code blocks |
| `--foreground` | `#ededee` | Primary text |
| `--muted` | `rgba(237,237,238,0.6)` | Body copy |
| `--subtle` | `rgba(237,237,238,0.38)` | Mono labels, page counter |
| `--accent` | `#a3e635` | The single signal color — one per slide |
| `--danger` | `#f87171` | Slide 06 only — the "wrong" column |
| dashed rail | `rgba(255,255,255,0.10)` × 10 ticks | Top + bottom of every slide |

### Typography

- **Display / body**: Geist (500 weight for headings, -0.025em to -0.035em tracking)
- **Mono**: JetBrains Mono (uppercase + 0.14em letter-spacing for labels)

Both loaded via Google Fonts in each slide. PPTX export falls back to system fonts (Geist won't embed); layout still holds because all sizing is in `pt`.
