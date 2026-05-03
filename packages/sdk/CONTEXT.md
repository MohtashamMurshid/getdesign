# sdk — domain glossary

Terms and naming for the TypeScript SDK workspace (`packages/sdk`). Expand as the domain stabilizes.

## Terms

- **Remote SDK** — The v1 public TypeScript interface for getdesign. It calls the HTTP API rather than running the agent pipeline in-process.
- **Design request** — A URL plus optional site name, visual fallback mode, API base URL, fetch adapter, and request-scoped BYOK credentials.
- **Design result** — The final `design.md` markdown plus structured `DesignDoc`, extracted tokens, visual description metadata, tile count, and run mode.
- **Design stream event** — Public SSE event from `/v1/design/stream`. Events are intentionally sanitized and never include screenshot tile image data or credentials.
- **Fetch adapter** — Optional concrete `fetch` implementation passed to the SDK for tests and non-standard runtimes.
