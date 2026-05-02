# cli — domain glossary

Terms and naming for the CLI workspace (`packages/cli`). Expand as the domain stabilizes.

## Modules and seams

- **CLI entry** — Thin **adapter**: `src/getdesign.ts` maps process exit codes and stderr to `runGetdesignCli` only.
- **Run CLI module** — `runGetdesignCli` is the **interface** for “run one design generation from argv/env/cwd”: parse → credential resolution → `runDesign` → write `design.md`. Tests and future embedders cross this **seam** without re-parsing argv.
- **Progress display** — `ProgressDisplay` + `summarizeDesignEvent` own timed stderr lines and the optional TTY spinner; callers pass `onPhase` only.
- **Output path** — Pure helpers for URL normalization and deterministic `./getdesign-runs/<slug>/design.md` resolution; **interface** is narrow so behavior stays in one place.
- **Parse args** — `parseArgs` / `usage` only; no I/O.
