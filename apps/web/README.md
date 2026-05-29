This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Dashboard credentials (Daytona + OpenAI)

The `/dashboard` runs the agent with a Daytona key (capture sandbox) and an
OpenAI key (synthesis). The API route at `app/api/design/route.ts` resolves these
per run, in priority order:

1. **Request body** — keys typed into the dashboard form (BYOK, never persisted server-side).
2. **WorkOS Vault** — the signed-in user's keys, saved once at `/dashboard/settings`.
3. **Environment variables** — `DAYTONA_API_KEY` / `OPENAI_API_KEY`, the local-dev fallback.

### Local development

No account needed. Set the keys in `apps/web/.env.local` and run as usual:

```bash
DAYTONA_API_KEY=dt_live_...
OPENAI_API_KEY=sk-...
```

### Per-user storage with WorkOS Vault

To let users sign in and store their own keys, configure WorkOS AuthKit + Vault:

```bash
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=...        # >= 32 chars, e.g. `openssl rand -base64 32`
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

When these are set, the app enables sign-in (`/login`, `/callback`) and the
`/dashboard/settings` page, where each user stores their Daytona and OpenAI keys
encrypted in WorkOS Vault (scoped to their user id). When they are **not** set,
the app stays in "local mode": no auth, env-var keys only, BYOK form still works.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
