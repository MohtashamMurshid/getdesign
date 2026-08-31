# analytics

Consent-gated PostHog integration shared by marketing and dashboard.

- **Completed signup**: verified WorkOS account created during the server-sealed authentication flow, after the authentication callback succeeds. Existing accounts never count as signups.
- **Run event**: a persisted lifecycle change acknowledged by a dashboard step response. Browser/network errors and historical page views are not run failures or completions.
- **Consent**: explicit permission for optional product analytics. No collection, identity linking, or replay before permission. Withdrawal clears SDK identity and prevents further collection.
- **First completed run**: the first `run_completed` in a person's ordered PostHog funnel. No claim is made about activity before consent or from other clients.
