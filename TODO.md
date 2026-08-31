# Beta to-do list

Follow-up work for the beta. These items are planned, not implemented.

## Overview CTA

- [ ] Add a prominent CTA to the dashboard Overview page that links to `/agent`.
  - Draft label: **Extract a design system**. Confirm the final copy before implementation.
  - Make it visible above the recent runs list, including for users with no runs yet.
  - Check the link, keyboard access, and mobile placement.

## Cached sites on the overview

- [ ] Show a selection of cached sites with results users can open on demand.
  - Choose the initial sites and the source of their saved results.
  - Show each site's name/domain and a small design preview.
  - Open the saved result without silently starting a new paid run.
  - Replace the current placeholder cached-site list and counts with real data, or hide unavailable counts.
  - Decide how results are refreshed and show a useful empty state when none are available.
  - Use curated examples or results the current user is allowed to view; do not expose another user's private runs.

## Best design this week

- [ ] Add a **Best design this week** section to the dashboard Overview page.
  - Feature a site with its name/domain, a design preview, and a link to its saved result.
  - Decide how the weekly featured design is selected and updated.
  - Use a curated example or a result the current user is allowed to view.
  - Hide the section or show an empty state when no design has been selected.

## Cmd+K

- [ ] Fix the dashboard's Cmd+K shortcut and command menu.
  - Reproduce and record the current issue before implementing a fix.
  - Verify that Cmd+K opens the menu, keyboard navigation works, and Escape closes it.
  - Check that menu actions navigate to the expected pages.

## Dashboard favicons

- [ ] Add the getdesign favicon and app icons to the dashboard.
  - Reuse the existing brand assets.
  - Verify the icon appears on dashboard browser tabs and bookmarks.

## Site SEO

- [ ] Review and improve SEO across the public sites, including marketing and documentation.
  - Add or correct page titles, descriptions, canonical URLs, and social-sharing metadata/images.
  - Check sitemaps, robots directives, and heading structure.
  - Keep private dashboard pages and preview deployments out of search indexing.
  - Verify metadata uses the correct production domains.

## PostHog analytics

- [ ] Add PostHog to the marketing site and dashboard.
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

## Starting points

- Overview: `apps/dashboard/app/(dashboard)/page.tsx`
- Agent: `apps/dashboard/app/(dashboard)/agent/page.tsx`
