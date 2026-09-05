# Product analytics

The marketing site and dashboard share `@getdesign/analytics`, using PostHog JS 1.422.5. Tracking is disabled by default. This integration does not require an account, paid API call, or remote setting change to build or test.

## Setup

Copy the analytics placeholders in each app's `.env.example` into its build environment. Supply a public PostHog project token, not a personal API key. The two production apps must use the same production project. Use different PostHog projects/tokens for development, preview, and production. Never add a production token to preview or development deployments.

| Variable | Required value |
| --- | --- |
| `POSTHOG_ENABLED` | `true` only after setup and privacy review |
| `POSTHOG_PROJECT_TOKEN` | Public `phc_` project token from the chosen project |
| `POSTHOG_HOST` | `https://us.i.posthog.com` or `https://eu.i.posthog.com` for that project |
| `POSTHOG_PROJECT_ENV` | `development`, `preview`, or `production`, matching that project |
| `POSTHOG_ALLOWED_ORIGINS` | Comma-separated exact origins, with no paths or trailing slashes |
| `POSTHOG_DEPLOYMENT_ENV` | Deployment environment for non-Vercel production builds only |

On Vercel, `VERCEL_ENV` takes precedence. Local `next dev` uses `development`. Missing or mismatched environment labels disable the integration. Origins are also checked in the browser and relay. Production accepts only `https://getdesign.app`, `https://www.getdesign.app`, and `https://dashboard.getdesign.app`. Development accepts explicit localhost/127.0.0.1 origins, including ports. Preview accepts explicit HTTPS origins outside the product domain.

Next.js embeds a validated public configuration at build time as `NEXT_PUBLIC_POSTHOG_CONFIG`. Do not set that derived value manually. Rebuild after changing setup. Project ownership cannot be inferred from a public token; deployment owners must verify that each token belongs to its labelled project. Origin/environment checks prevent a production bundle from tracking on a preview host, but cannot detect a token copied into the wrong labelled environment.

For production, both apps' allowed origins should be `https://www.getdesign.app,https://getdesign.app,https://dashboard.getdesign.app`. The native PostHog cookie and an explicit consent preference use the parent `getdesign.app` domain. Preview and development use host-only cookies with separate environment names. There is no cross-domain URL decoration, identity query parameter, custom anonymous identifier, or cookieless fallback.

## Consent and privacy

Users can open **Privacy settings** at the bottom right of either app to allow or reject optional analytics. The control appears only with valid configuration. It starts off, has no preselected permission, and can be reopened to withdraw consent. The same preference applies to both production subdomains. Do Not Track and Global Privacy Control take precedence. Privacy review must confirm the final notice, retention policy, and regional requirements before enabling production.

The SDK loads only after permission. No event backlog or identity is created before consent. Withdrawal resets the SDK identity, removes its stored data through its opt-out API, and blocks future events. Focus/visibility changes refresh consent in other tabs, and every capture and relay request checks the current preference. Already transmitted events cannot be recalled by withdrawal; use the normal PostHog deletion process when required.

Autocapture, pageviews/pageleaves, session replay, error capture, heatmaps, performance capture, surveys, tours, conversations, remote flags, and external SDK extensions are disabled. Replay is not needed for V1 and stays off. SDK event URLs are discarded, campaign/referrer persistence is off, and SDK session attribution records are removed through its public unregister API before transport, and both apps send a `no-referrer` policy. `before_send` rebuilds every event from an allowlist and drops all other events and properties, including top-level person updates.

The same-origin `/api/analytics/e` relay checks consent again before forwarding only rebuilt events to the configured PostHog ingestion host. It never forwards incoming request headers, cookies, auth tokens, referrers, IP addresses, or query parameters. This also stops delayed SDK retries after withdrawal. The relay drops malformed, oversized, unknown, and unsupported batched requests. It cannot proxy flags, replay, or arbitrary destinations. Failed telemetry is dropped without logging payloads or raw errors.

Events contain an SDK-generated anonymous ID or the opaque WorkOS user ID, fixed surface/environment labels, schema version, and the properties below. They never contain emails, provider keys, auth tokens, submitted URLs, raw errors, generated content, domain names, or download filenames. IP enrichment is disabled per event; the relay sends no user IP. Confirm IP discard in the PostHog project as defense in depth. No remote settings were changed during implementation.

## Events and lifecycle

| Event | Allowed custom properties | Trigger |
| --- | --- | --- |
| `cta_clicked` | `cta`: `nav_get_started`, `hero_extract`, `footer_dashboard`, `final_extract`, `dashboard_start` | Explicit click/send handler |
| `signup_completed` | Deterministic `$insert_id` | Successful WorkOS callback for a verified account created during the server-sealed, consented auth flow |
| `run_started` | `mode`, deterministic `$insert_id` | A step response confirms that this request first persisted `startedAt` |
| `run_completed` | `mode`, deterministic `$insert_id` | A step response confirms persisted `completed` status after markdown was saved |
| `run_failed` | `mode`, allowlisted `step`, deterministic `$insert_id` | A step response confirms persisted failure |
| `design_md_downloaded` | None | The browser dispatches the design.md download link |
| `$identify` | Only SDK anonymous ID and opaque WorkOS ID | Authenticated dashboard mount, once consent is present |

Shared fields are `surface`, `environment`, `schema_version`, `distinct_id`, `$geoip_disable`, and `$process_person_profile`. The transport adds the public project token, event time, and an event UUID. Mode is `visual` or `text_only`; steps are `crawl`, `capture`, `extract`, `describe`, `synthesize`, or `render`.

Signup is not synonymous with login. `/sign-in` adds the flow start time only when configured and consented. AuthKit seals that state with its PKCE verifier. The callback checks verified email and account creation time inside the ten-minute flow, excludes impersonation, and rechecks consent. Old accounts, missing/expired state, failed authentication, and later opt-in never produce signup events. Accounts created through other flows are deliberately not guessed or backfilled.

Run instrumentation uses persisted state acknowledgements, not React renders or raw HTTP errors. A queued record is not a started run. Existing completed pages, rerenders, skipped steps, client network errors, and pre-consent starts are not counted. Repeated responses and retries use the same deterministic event UUID, plus in-memory deduplication. Each run can have one start, one completion, and one failure per mode; a recovered visual failure can later complete in text-only mode. Local run IDs feed the hash and are never sent as properties.

Run events require consent at both request start and response processing. Delivery is best effort: if the initiating tab closes or loses the response, that acknowledgement can be missing. Downloads measure browser download initiation, not proof the user saved the file. SDK/API/CLI runs are outside this marketing/dashboard integration.

## Journey and verification

Use an ordered PostHog person funnel from `cta_clicked` with a marketing CTA, through `signup_completed`, `run_started`, and the first `run_completed`. Use a separate CTA → run funnel for existing accounts. PostHog's native cookie links the consented production subdomains, and standard `identify` merges the anonymous journey with the account. No custom identity handoff is used. "First" means first observed completion for that person within analytics, not a lifetime claim about activity before consent or in other clients.

Run local checks without setting a real project token:

```sh
bun test packages/analytics/test
bun run --cwd packages/analytics typecheck
bun test apps/web/test apps/dashboard/lib apps/dashboard/tests/onboarding.test.ts apps/dashboard/tests/analytics-lifecycle.test.ts
bun run --cwd apps/web build
bun run --cwd apps/dashboard typecheck
```

The transport suite runs the real pinned SDK in an isolated DOM with intercepted requests, then exercises the same relay with mocked ingestion. It checks default-event suppression, native identity sharing between the production subdomains, account linking, payload filtering, withdrawal, and delayed-request rejection. Other tests cover environment separation, incomplete configuration, auth eligibility, repeated lifecycle acknowledgements, and invalid properties. No test emits production or user telemetry.

Live verification remains pending until the owner supplies separate project tokens, the ingestion region, and approved preview origins. With an approved nonproduction project, verify consent off/on/off, a marketing CTA → new verified signup → first completed run, returning login without a signup event, failed/recovered runs, downloads, and duplicate suppression in PostHog. Review event properties directly and confirm there are no replay, pageview, exception, URL, or email fields before enabling production.

Official references reviewed for this implementation:

- [JavaScript configuration](https://posthog.com/docs/libraries/js/config)
- [Data collection and opt-in/out](https://posthog.com/docs/privacy/data-collection)
- [Persistence and cookies](https://posthog.com/docs/libraries/js/persistence)
- [Identifying users](https://posthog.com/docs/product-analytics/identify)
- [Capture API](https://posthog.com/docs/api/capture)
- [Reverse proxies](https://posthog.com/docs/advanced/proxy)
- [WorkOS AuthKit callback and sealed state](https://workos.com/docs/sdks/authkit-nextjs)
