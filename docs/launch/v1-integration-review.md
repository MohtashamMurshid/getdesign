# V1 integration review

Reviewed on 2026-08-31. Five implementation tasks started from `codex/v1-leftovers` at `20fd06fc59ce3c9697c40e151e2afcc590fbc7e8` in separate worktrees. The combined result is on the local `codex/v1-launch-integration` branch. Nothing was pushed, deployed or published. The original checkout and its uncommitted SDK documentation were not changed.

## Source commits

| Task | Source commit |
| --- | --- |
| Dashboard statistics and dead control cleanup | `0476317e6650680f170b5cd2c135b750a5acb411` |
| First-run setup and design export guidance | `7b540838f1f3eee5bb8b2c087ec683fb4c92e169` |
| Loading-screen capture reliability | `acf51d5` |
| Public launch copy and setup documentation | `da1a4fc` |
| Dashboard command menu | `84402e6` |

## Combined changes

The Overview conflict was resolved by retaining onboarding, the empty state and mobile run-row fixes, while keeping the mock statistic cards and inactive View all button removed.

The Overview regression test now mocks only the asynchronous onboarding server boundary and renders the real guidance component. It checks that the extraction CTA appears before recent runs and that the empty state and Account link remain. Onboarding's server and credential-readiness tests run in a child process to prevent its module mocks from affecting other suites.

## Verification

From the combined worktree after `bun install --frozen-lockfile`, building the types/content/tools/agent packages and generating dashboard route types:

```sh
bun test apps/dashboard/lib apps/dashboard/tests/onboarding.test.ts convex packages/tools/test packages/agent/test apps/web/test packages/content/src/index.test.ts apps/api/test --timeout 10000
bun run --cwd apps/dashboard typecheck
bun run --cwd apps/web typecheck
bun run --cwd packages/tools typecheck
bun run --cwd packages/agent typecheck
git diff --check
```

The combined command passed 141 tests across 22 files, with zero failures. The onboarding wrapper also passed its isolated nine-test child suite. All four typechecks and the whitespace check passed.

The task-level command-menu fixture passed 62 interaction assertions, including all nine destinations, and mobile checks. Onboarding's fixture covered missing/single/both keys, save failures and retries, removal, empty/populated runs and narrow layouts. These fixture results do not establish authenticated end-to-end behavior.

## Remaining checks and behavior limits

- Verify the fresh-account flow, actual credential persistence, and authenticated Next router transitions. Saved-key readiness is not provider-key validity.
- Verify native Tab/Shift+Tab and native Enter/Space activation. The task browser sent synthetic keyboard events without native default actions. A coordinator Chrome check timed out and did not close this gap.
- Verify real Daytona/Chromium capture and a completed live extraction with separately approved provider usage. No paid provider calls were made. Capture tests evaluate the real expression against simulated DOM geometry and mock the SDK boundary.
- Capture now fails when readiness cannot be measured. The Computer Use height-measurement fallback still works after readiness succeeds. The detector does not recognize every custom animation or canvas-rendered gate; ambiguous gates fail without clicks.
- Verify actual file delivery to disk. The onboarding fixture observed a Blob-download request named `design.md`, not a completed browser download.

Detailed procedures are in [command menu verification](cmd-k-verification.md), [onboarding verification](../../apps/dashboard/tests/ONBOARDING.md), and [capture readiness](../../packages/tools/README.md#capture-readiness).
