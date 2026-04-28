# Studio TODO

## Next Milestone: Deck Planning

- Add a dedicated deck-planning mode after Pi auth and chat are stable.
- Add a Studio system prompt that asks for deck goals, audience, tone, length, and source material before writing slide files.
- Store a deck plan as structured local state: title, audience, narrative arc, slide list, open questions, and assumptions.
- Keep the deck planner conversational; do not generate HTML until the user confirms the plan.

## Next Milestone: HTML Preview And Export

- Generate one HTML file per slide plus a deck `index.html` manifest.
- Preview generated slides inside the Electron app in a sandboxed browser view.
- Add PDF export from the HTML deck using local Chromium.
- Add editable PPTX export using the Huashu HTML-first slide constraints.
- Add verification for generated decks: render check, missing asset check, and export smoke test.

## Deferred Claude Design Parity

- Inline comments and pinned feedback on preview elements.
- AI-generated tweak controls for spacing, color, typography, and layout.
- Multi-artifact generation beyond slides: prototypes, one-pagers, campaign assets, and app mockups.
- Team design-system onboarding and reusable brand libraries.
- Cloud sync, sharing, collaboration, and organization permissions.
- Version history, branching, and artifact diffing.
- Gallery demos and templates.

## Security And Packaging Follow-Ups

- Revisit Electron sandbox hardening after Pi SDK integration is stable.
- Keep credentials in Pi auth storage or main-process runtime state only.
- Do not expose raw API keys, OAuth tokens, or Pi auth JSON to the renderer.
- Clarify product naming and trademark language so the app is positioned as an open alternative, not an official Anthropic product.
