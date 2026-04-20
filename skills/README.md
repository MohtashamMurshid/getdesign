# getdesign skills

Agent skills for the `getdesign` ecosystem, distributed via [skills.sh](https://skills.sh).

## Skills in this directory

| Skill | Description |
| --- | --- |
| [`getdesign`](./getdesign/SKILL.md) | Generate the 9-section `design.md` for any URL using the agent's built-in tools (WebFetch, browser, file write). Portable twin of the hosted `getdesign.app` pipeline. |

## Install

From any project, once this repo is published to GitHub:

```bash
# Install all skills
npx skills add <owner>/getdesign

# Install just the getdesign skill, globally, into Claude Code + Codex + Cursor
npx skills add <owner>/getdesign --skill getdesign -g -a claude-code -a codex -a cursor

# Install directly from a subfolder URL
npx skills add https://github.com/<owner>/getdesign/tree/main/skills/getdesign
```

Local install (before publishing):

```bash
npx skills add ./skills
```

## Publishing to the skills.sh leaderboard

1. Push this repo to GitHub (public).
2. Anyone installing via `npx skills add <owner>/getdesign` contributes anonymous install telemetry; the leaderboard at [skills.sh](https://skills.sh) surfaces the most-installed skills automatically.
3. No manual submission step — the CLI does it.

## Surfaces

`getdesign` ships as five surfaces sharing one spec:

1. **Web** — [getdesign.app](https://getdesign.app) chat UI
2. **HTTP API** — `api.getdesign.app/?url=…`
3. **CLI** — `npx getdesign <url>`
4. **TypeScript SDK** — `npm i getdesign`
5. **Agent Skill** — this directory, installable via `npx skills add`

The skill is the only surface that runs *inside* the user's own agent loop with *its* tools — zero infrastructure.
