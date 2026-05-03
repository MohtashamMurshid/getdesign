# @getdesign/cli

> The design system for any URL.

Generate a production-grade `design.md` from a public site using the
getdesign API through `@getdesign/sdk`.

## Usage

```bash
DAYTONA_API_KEY=... OPENAI_API_KEY=... bunx @getdesign/cli https://cursor.com
bunx @getdesign/cli https://linear.app --api-url http://localhost:3001
bunx @getdesign/cli https://linear.app --out design.md
bunx @getdesign/cli --url https://example.com --site-name Example --out ./designs
```

The binary runs on Bun. Install Bun first if `bunx` is not available:
<https://bun.sh/docs/installation>.

When `--out` is omitted, the CLI writes to a deterministic local run folder:
`./getdesign-runs/<slug>/design.md`. This keeps generated files out of the repo
root while avoiding confusion with the package name.

Options:

- `--url <url>` or positional `<url>`: source URL to analyze.
- `--site-name <name>`: override the detected site name.
- `--api-url <url>` / `GETDESIGN_API_URL`: getdesign API base URL. Defaults to
  `https://api.getdesign.app`; use `http://localhost:3001` for local dogfooding.
- `--out <path>`: write markdown to a file or directory. File paths are written
  exactly; existing directories or paths ending in `/` receive `design.md`.
  Without `--out`, output is written to `./getdesign-runs/<slug>/design.md`.
- `--daytona-api-key <key>` / `DAYTONA_API_KEY`: Daytona key for this run.
- `--openai-api-key <key>` / `OPENAI_API_KEY`: OpenAI key for this run.
- `--text-only-fallback`: continue with CSS/text-only output if visual capture
  is unavailable.

Progress is streamed to stderr as concise phase updates (`crawl`, `capture`,
`visual`, `describe`, `extract`, `synthesize`, `render`) so stdout and generated
files stay clean.

For tests or embedding, import `runGetdesignCli` from `./runGetdesign.ts` and
pass `argv`, `env`, `cwd`, or `now` instead of relying on global `process`
defaults.

- Web · [getdesign.app](https://getdesign.app)
- API · `api.getdesign.app`
- CLI · `@getdesign/cli`
- SDK · `@getdesign/sdk`

MIT © getdesign
