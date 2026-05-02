# ADR 0002: BYOK Daytona runtime provisioning

## Status

Accepted

## Context

V1 of getdesign is BYOK-only: each authenticated user provides their own Daytona and OpenAI credentials, and getdesign does not subsidize Daytona or LLM usage. The full landing page capture path (see ADR 0001) needs a deterministic Daytona runtime — Chromium + Xvfb + tuned fonts and helpers — that matches the rendering and screenshot expectations of `@getdesign/tools`.

The earlier integration assumed a shared `getdesign-latest` snapshot existed in every Daytona account. In practice, no such snapshot is provisioned automatically when a user adds their Daytona key, so visual runs failed with `Snapshot getdesign-latest not found`. Even if maintainers manually created a snapshot, it lived in a single account and could not be reused by every BYOK user.

We need a model that:

- gives every user a reusable, deterministic capture runtime in their own Daytona account;
- avoids requiring each user to build and push a Docker image themselves;
- supports rolling out runtime fixes without breaking older runs;
- never silently falls back to platform-funded Daytona capacity if a user's account cannot provision the runtime.

## Decision

getdesign publishes the capture runtime as a public, versioned OCI image on GHCR (built from `infra/daytona/Dockerfile`), pinned by digest. Each user's Daytona account imports that image into an immutable per-user snapshot named `getdesign-capture-<runtimeVersion>` and reuses it for every subsequent run.

Provisioning lives behind a shared `ensureDaytonaCaptureSnapshot(client, options)` helper in `@getdesign/tools/daytona`:

- look up the current snapshot by name in the user's Daytona account;
- if missing, create it from the pinned public image with appropriate resources;
- poll until the snapshot reaches the `active` state;
- treat terminal failure states (`error`, `build_failed`) and timeouts as actionable provisioning errors.

Web onboarding calls this helper as an explicit setup/check step before allowing visual runs. API, SDK, and CLI runs auto-ensure on the first run with a given Daytona credential and emit `provisioning_capture_runtime` / `capture_runtime_ready` / `capture_runtime_failed` status events while waiting.

`CAPTURE_RUNTIME_VERSION` is bumped whenever `infra/daytona/Dockerfile` changes in a way that affects rendering or screenshots. New versions create a new per-user snapshot alongside any existing ones, so old runs stay reproducible. v1 does not auto-delete user-owned snapshots.

When provisioning or capture cannot complete (quota, build failure, permissions, retries exhausted) the run returns `capture_runtime_unavailable` (or `capture_failed`) with the snapshot name and an actionable reason. The user is then offered an explicit text-only re-run (`x-getdesign-mode: text_only` for the API, `--text-only` for the CLI). getdesign never substitutes shared infrastructure.

The capture runtime image and snapshot name are not user-configurable in v1. An internal env override (`GETDESIGN_CAPTURE_RUNTIME_IMAGE`) is allowed for development only.

## Consequences

Every BYOK user gets a deterministic runtime they pay Daytona for directly. Maintainers control the image so users do not need Docker, GHCR pushes, or a Daytona CLI on their own machines. Versioning the snapshot name makes runtime upgrades safe and reversible.

Provisioning the snapshot the first time can take a couple of minutes while Daytona pulls the image and validates it. The web setup flow needs to expose that delay clearly, and API/CLI runs need first-run status events so callers do not assume the run hung.

Because we never auto-delete user-owned snapshots, repeated runtime version bumps can accumulate snapshots in a user's Daytona account. We accept this in v1 and plan to add an explicit cleanup action later.

The text-only fallback is the only escape hatch when capture is unavailable. Marking those runs explicitly (`mode: 'text_only'`) keeps the BYOK promise honest: visual sections of `design.md` always reflect either real captures or an acknowledged degraded path.
