# Beta to-do list

Implementation status and remaining beta checks. See [the V1 integration review](docs/launch/v1-integration-review.md) for the five completed implementation tasks and verification limits.

## Overview CTA

- [x] Add a prominent CTA to the dashboard Overview page that links to `/agent`.
  - Label: Extract a design system.
  - Visible above recent runs, with an empty state and provider-key setup guidance.
  - Link, layout, and server credential-readiness tests pass. Native browser activation still needs the smoke check below.

## Cached sites on the overview

- [ ] Show a selection of cached sites with results users can open on demand.
  - Choose the initial sites and the source of their saved results.
  - Show each site's name/domain and a small design preview.
  - Open the saved result without silently starting a new paid run.
  - The placeholder cached-site list and unavailable global/cache counts have been removed. A real gallery remains unimplemented.
  - Decide how results are refreshed and show a useful empty state when none are available.
  - Use curated examples or results the current user is allowed to view; do not expose another user's private runs.

## Best design this week

- [ ] Add a **Best design this week** section to the dashboard Overview page.
  - Feature a site with its name/domain, a design preview, and a link to its saved result.
  - Decide how the weekly featured design is selected and updated.
  - Use a curated example or a result the current user is allowed to view.
  - Hide the section or show an empty state when no design has been selected.

## Cmd+K

- [x] Implement the dashboard's Cmd+K shortcut and command menu.
  - The pre-fix reproduction and final checks are recorded in [command menu verification](docs/launch/cmd-k-verification.md).
  - Fixture checks pass for Cmd/Ctrl+K, filtering, arrow navigation, Enter selection, Escape and all nine destinations.
  - Native Tab/Shift+Tab and Enter/Space button activation, plus authenticated Next navigation, remain unverified.

## Other completed V1 implementations

- [x] Remove unsupported Overview statistics and the inactive View all control; label the displayed run count accurately.
- [x] Add bounded capture readiness and conservative intro-gate handling, with failure propagation and explicit text-only opt-in preserved.
- [x] Align public launch copy, examples, linked setup docs and CTAs with WorkOS authentication and Daytona/OpenAI BYOK.

## Dashboard favicons

- [x] Add the getdesign favicon and app icons to the dashboard.
  - Reuse the existing brand assets.
  - Verify the icon appears on dashboard browser tabs and bookmarks.

## Site SEO

- [x] Review and improve SEO across the public sites, including marketing and documentation.
  - Add or correct page titles, descriptions, canonical URLs, and social-sharing metadata/images.
  - Check sitemaps, robots directives, and heading structure.
  - Keep private dashboard pages and preview deployments out of search indexing.
  - Verify metadata uses the correct production domains.

## PostHog analytics

- [x] Add PostHog to the marketing site and dashboard.
  - Define events for CTA clicks, completed signup, run started, run completed/failed, and downloads.
  - Track the journey from the marketing CTA to a user's first completed run.
  - Keep provider keys, auth tokens, submitted URLs, and generated content out of analytics payloads.
  - Decide consent requirements and whether session replay is needed; keep replay off until privacy controls are reviewed.
  - Separate development and production activity and verify events before launch.

## Design fixes

- [ ] Identify and record the specific dashboard design fixes before implementing them.
  - Review the Overview and Agent pages for spacing, typography, button hierarchy, and mobile layout.
  - Capture screenshots and list the agreed changes here.
  - Verify the finished pages with both populated and empty states.

## HTML output link

- [ ] Add an HTML link for completed runs.
  - Decide whether the link opens a rendered preview or downloads an HTML file.
  - Show it only when the run has an HTML artifact.
  - Keep private output behind the same run-owner checks as `design.md`.
  - Verify keyboard access, mobile layout, and missing-artifact behavior.

## Remaining launch smoke checks

- [ ] Use a fresh signed-in account to verify provider-key save, refresh, removal and return to Agent.
- [ ] Verify Cmd+K and navigation with native keyboard events, including Tab/Shift+Tab and Enter/Space activation.
- [ ] Run approved live captures of ordinary, loading and gated pages. Automated capture checks currently use simulated DOM geometry and mocked Daytona calls.
- [ ] Verify a completed live run downloads a usable `design.md` to disk.

## Starting points

- Overview: `apps/dashboard/app/(dashboard)/page.tsx`
- Agent: `apps/dashboard/app/(dashboard)/agent/page.tsx`
