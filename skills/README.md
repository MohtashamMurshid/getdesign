# getdesign skills

Agent skills for the `getdesign` ecosystem, distributed via [skills.sh](https://skills.sh).

## Skills in this directory


| Skill                               | Description                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[getdesign](./getdesign/SKILL.md)` | Generate the 9-section `design.md` for any URL using the agent's built-in tools (WebFetch, browser, file write). Portable twin of the hosted `getdesign.app` pipeline. |


## Install

```bash
# Install all skills from this repo (interactive agent picker)
npx skills add MohtashamMurshid/getdesign

# Install just the getdesign skill, globally, into Claude Code + Codex + Cursor
npx skills add MohtashamMurshid/getdesign --skill getdesign -g -a claude-code -a codex -a cursor -y

# Install directly from the skill subfolder URL
npx skills add https://github.com/MohtashamMurshid/getdesign/tree/main/skills/getdesign

# List skills without installing
npx skills add MohtashamMurshid/getdesign --list
```

Local install (from a clone of this repo):

```bash
npx skills add ./skills
```

## Leaderboard

The repo is public at [github.com/MohtashamMurshid/getdesign](https://github.com/MohtashamMurshid/getdesign). Every `npx skills add MohtashamMurshid/getdesign` sends anonymous install telemetry to the `skills` CLI; the leaderboard at [skills.sh](https://skills.sh) ranks by installs automatically — no manual submission step.

## Surfaces

`getdesign` ships as five surfaces sharing one spec:

1. **Web** — [getdesign.app](https://getdesign.app) chat UI
2. **HTTP API** — `api.getdesign.app/?url=…`
3. **CLI** — `npx @getdesign/cli <url>`
4. **TypeScript SDK** — `npm i @getdesign/sdk`
5. **Agent Skill** — this directory, installable via `npx skills add`

The skill is the only surface that runs *inside* the user's own agent loop with *its* tools — zero infrastructure.