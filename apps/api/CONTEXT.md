# api — domain glossary

Terms and naming for the HTTP API workspace (`apps/api`). Expand as the domain stabilizes.

## Terms

- **Design endpoint** — `GET /v1/design`, the request/response interface for producing one `design.md` from a URL.
- **Design stream endpoint** — `GET /v1/design/stream`, the Server-Sent Events interface for progress updates followed by a final design result.
- **Request-scoped credentials** — Daytona and OpenAI keys sent only for the current request via headers. The API must forward them to the agent and must never log or echo them.
- **Text-only retry** — A degraded run requested with `x-getdesign-mode: text_only` after visual capture fails or the user explicitly accepts non-visual output.
- **Public progress event** — Sanitized progress data sent to SDK/CLI clients. It omits screenshot tile image data, raw crawl payloads, and credentials.
