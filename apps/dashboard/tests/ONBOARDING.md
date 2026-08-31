# Extraction onboarding checks

Run commands from `apps/dashboard` unless noted otherwise.

## Automated checks

```sh
bun test lib tests/onboarding.test.ts
bun run typecheck
```

The onboarding wrapper runs `onboarding-suite.tsx` in a child Bun process. Its auth, navigation, Convex, and mutation mocks cannot leak into other suites. The suite is not named `*.test.tsx`, so normal discovery runs it only through the wrapper.

On a fresh checkout, install with `bun install --frozen-lockfile` at the repository root. Build `packages/tools` and `packages/agent` with their `build` scripts, then run `bun run next typegen` in the dashboard before typechecking. These commands do not need provider keys.

## Browser fixture

```sh
bun tests/fixtures/serve-onboarding.ts
```

Open `http://127.0.0.1:3112`. This separate fixture renders the actual Overview, Provider keys card, Agent command, and completed-run shell. It replaces auth, data queries, navigation, credential saves, and run creation with local mocks. It does not bypass authentication in the Next app or contact provider APIs. Use dummy keys starting with `fixture-`. Do not enter real credentials.

The fixture controls switch between empty and populated runs, simulate save failure, and clear dummy keys. Saving or removing a key causes a simulated server-metadata refresh. The download output records the filename requested by the real export control. It does not prove the browser saved a file to disk.

## Verification on 2026-08-31

- `bun test lib tests/onboarding.test.ts`: 20 parent tests passed, including an isolated child suite with 9 passing tests. No failures.
- `bun run next typegen && bun run typecheck`: passed after building local package dependencies.
- ESLint on all changed TypeScript files: no errors. The existing `input-bar.tsx` image warning remains.
- `git diff --check`: passed.
- Browser fixture: no keys, Daytona only, OpenAI only, both keys, successful save, pending save, failed save with retained draft, retry, and successful removal checked. Saving both keys enabled Agent. Removing one key restored setup guidance and disabled Agent.
- Browser fixture: Enter in Agent's URL field opened the mock run. The send arrow is now a named native button. Input labels, submit-button semantics, focus styles, and save/error live regions were checked. Synthetic Enter events did not trigger native implicit form submission or link activation in the browser tool, so those native keyboard defaults still need a manual-browser check.
- Browser fixture: Overview, Account, Agent, and the completed-run download toolbar inspected at 390px width. Overview also checked at 320px, 768px, and desktop width. No horizontal overflow was measured at the checked narrow widths. The recent-run title remains visible at 320px, and the download toolbar wraps on mobile.
- Browser fixture: the completed-run control requested a Blob download named `design.md`. The browser tool did not expose a completed download event, so disk delivery remains unverified.

No real fresh account, live credential persistence, provider-key validity, or paid extraction was tested. A saved-key readiness result means the required keys exist, not that the providers accepted them.

## Stats-task integration

The stats task's `lib/overview.test.tsx` renders `await Page()` with `renderToStaticMarkup`. It must mock the async onboarding child before importing Page:

```tsx
mock.module("../components/extraction-onboarding", () => ({
  ExtractionOnboarding: () => null,
}));
```

The onboarding suite independently checks the real server boundary, authenticated metadata queries, and all key states. With the stats boundary mock, both suites can run in the same Bun command; onboarding's mocks live only in its subprocess.

A temporary local preview combined the stats page/test from commit `0476317` with the onboarding insertion, empty state, responsive run-row classes, and the boundary mock above. Running `bun test lib tests/onboarding.test.ts ./tests/onboarding-integration.ByJjoy/overview.test.tsx` passed 23 parent tests plus the 9-test child suite. The preview files were removed afterward. No files in the stats worktree were changed.
