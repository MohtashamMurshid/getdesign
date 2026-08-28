# dashboard

Authenticated product dashboard (Next.js + WorkOS AuthKit).

## Terms

- **Surface page** — in-app docs + animated preview for API, CLI, SDK, or Skills.
- **Developer kit** — shared UI under `components/developer/` for surface pages.
- **Credential callout** — docs-only note that v1 has no getdesign API key; BYOK uses Daytona/OpenAI.
- **Provider keys** — per-user Daytona and OpenAI keys saved from Account, stored as ciphertext in Convex. Dashboard runs decrypt them on the server and never fall back to `process.env`.
