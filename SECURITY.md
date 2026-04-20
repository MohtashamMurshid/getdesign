# Security Policy

## Supported versions

`getdesign` is pre-1.0. Security fixes are applied to `main` and the most recent published release of each surface:


| Surface                                 | Supported               |
| --------------------------------------- | ----------------------- |
| `getdesign` npm package (SDK)           | Latest minor on npm     |
| `getdesign` CLI                         | Latest minor on npm     |
| `api.getdesign.app`                     | Deployed HEAD of `main` |
| `getdesign.app` web                     | Deployed HEAD of `main` |
| `getdesign` skill (`skills/getdesign/`) | HEAD of `main`          |


## Reporting a vulnerability

**Please do not open a public GitHub issue for security reports.**

Instead, use one of:

1. **GitHub private vulnerability reporting** — [Report a vulnerability](https://github.com/MohtashamMurshid/getdesign/security/advisories/new) (preferred).
2. **Email** — `mohtashammurshid+security@gmail.com`. Please include:
  - A description of the issue and its impact
  - Steps to reproduce
  - The surface(s) affected (web, API, CLI, SDK, skill, shared packages)
  - Any proof-of-concept code or URL
  - Your preferred name for attribution (or "anonymous")

You will receive an acknowledgement within **72 hours**. A triage decision and remediation plan will follow within **7 days** for valid reports.

## Scope

In-scope:

- Remote code execution, SSRF, or container escape in the hosted `api.getdesign.app` pipeline or Daytona snapshot.
- Any path that lets a user cause `getdesign` to fetch internal / private-IP resources.
- Supply-chain issues in the published `getdesign` npm package or the `skills/getdesign/` skill.
- XSS, CSRF, auth bypasses in `getdesign.app`.
- Prompt-injection paths that can exfiltrate user data or keys from a hosted run.

Out of scope:

- Rate limiting / denial-of-service on the public free-tier API.
- Reports depending on physical access, social engineering, or compromised user devices.
- Self-XSS without a realistic delivery vector.
- Best-practice advice without a concrete impact (e.g. "you should add header X").

## Handling agent-skill-specific risk

The `getdesign` agent skill runs inside the user's own coding agent (Claude Code, Codex, Cursor, etc.) using that agent's built-in tools. The skill itself has no network, file-system, or shell capability independent of the host agent. Security issues in the skill therefore reduce to:

- Prompts in `SKILL.md` / `TEMPLATE.md` that could coerce the host agent into unsafe behavior.
- Instructions that encourage the agent to fetch private / internal URLs.
- Instructions that would cause the agent to write files outside the working directory without user consent.

All three are in-scope and should be reported via the channels above.

## Safe-harbor

We will not pursue legal action against researchers who:

- Act in good faith to identify and report vulnerabilities.
- Avoid privacy violations, destruction of data, and interruption of service.
- Give us a reasonable window to remediate before public disclosure (90 days is our default).

Thanks for helping keep `getdesign` and its users safe.