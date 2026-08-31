import { expect, test } from "bun:test";
import { captureRunReceipt, runReceipt } from "../src/lifecycle";
import {
  captureCompletedSignup,
  isCompletedSignup,
  signupFlowState,
} from "../src/auth";
import { config, grantedCookie, harness, userId } from "./helpers";

const now = Date.now();
const state = signupFlowState(true, now - 1000);
const newUser = {
  id: userId,
  createdAt: new Date(now - 500).toISOString(),
  emailVerified: true,
};
test("signup requires new verified account inside the sealed flow, never any login", () => {
  expect(isCompletedSignup(state, newUser, now)).toBe(true);
  expect(signupFlowState(false, now)).toBeUndefined();
  for (const user of [
    { ...newUser, createdAt: new Date(now - 2000).toISOString() },
    { ...newUser, createdAt: new Date(now + 1).toISOString() },
    { ...newUser, emailVerified: false },
    { ...newUser, createdAt: "invalid" },
  ])
    expect(isCompletedSignup(state, user, now)).toBe(false);
  for (const input of [
    undefined,
    "invalid",
    "null",
    "{}",
    signupFlowState(true, now + 1),
    signupFlowState(true, now - 600001),
  ])
    expect(isCompletedSignup(input, newUser, now)).toBe(false);
});

test("signup transport is allowlisted, idempotent, and never backfilled without consent", async () => {
  const events: unknown[] = [];
  const transport = (async (_url: unknown, options?: RequestInit) => {
    events.push(JSON.parse(String(options?.body)));
    return new Response("{}");
  }) as typeof fetch;
  const req = (cookie = grantedCookie) =>
    new Request(`${config.origins[0]}/auth/callback?code=SECRET`, {
      headers: {
        cookie,
        authorization: "Bearer SECRET",
        referer: "https://private.test",
      },
    });
  for (const cookie of ["", "gd_analytics_consent_v1_development=denied"])
    await captureCompletedSignup(
      req(cookie),
      JSON.stringify(config),
      state,
      newUser,
      transport,
    );
  await captureCompletedSignup(req(), "null", state, newUser, transport);
  await captureCompletedSignup(
    req(),
    JSON.stringify(config),
    undefined,
    newUser,
    transport,
  );
  expect(events).toHaveLength(0);
  await captureCompletedSignup(
    req(),
    JSON.stringify(config),
    state,
    newUser,
    transport,
  );
  await captureCompletedSignup(
    req(),
    JSON.stringify(config),
    state,
    newUser,
    transport,
  );
  expect(events).toHaveLength(2);
  expect((events[0] as { uuid: string }).uuid).toBe(
    (events[1] as { uuid: string }).uuid,
  ); // Stable callback identity.
  expect(JSON.stringify(events)).not.toMatch(
    /SECRET|createdAt|email|referrer|accessToken/,
  );
  const event = events[0] as {
    properties: { distinct_id: string };
    event: string;
  };
  expect(event.event).toBe("signup_completed");
  expect(event.properties.distinct_id).toBe(userId);
});

test("queued and network errors are not run starts, failures, or completions", async () => {
  const h = harness();
  await h.analytics.setConsent("granted");
  await captureRunReceipt(h.analytics, "private-run", undefined);
  await captureRunReceipt(
    h.analytics,
    "private-run",
    runReceipt({ status: "queued" }),
  );
  expect(h.sent).toHaveLength(0);
  await captureRunReceipt(
    h.analytics,
    "private-run",
    runReceipt({ status: "running", startedAt: now }),
  );
  expect(h.sent.map((event) => event.event)).toEqual(["run_started"]);
});

test("persisted lifecycle emits once per run across repeated step acknowledgements", async () => {
  const h = harness();
  await h.analytics.setConsent("granted");
  const running = runReceipt({ status: "running", startedAt: now });
  const failed = runReceipt({
    status: "failed",
    startedAt: now,
    error: { step: "capture" },
  });
  const completed = runReceipt({
    status: "completed",
    startedAt: now,
    mode: "text_only",
  });
  for (const receipt of [
    running,
    running,
    failed,
    failed,
    running,
    completed,
    completed,
  ])
    await captureRunReceipt(h.analytics, "private-run", receipt);
  expect(h.sent.map((event) => event.event)).toEqual([
    "run_started",
    "run_failed",
    "run_completed",
  ]);
  expect(h.sent[2].properties.mode).toBe("text_only");
  expect(JSON.stringify(h.sent)).not.toContain("private-run");
  // A fresh client sees the same persisted receipt, but produces the same UUID.
  const refreshed = harness();
  await refreshed.analytics.setConsent("granted");
  await captureRunReceipt(refreshed.analytics, "private-run", completed);
  expect(refreshed.sent[1].uuid).toBe(h.sent[2].uuid);
  await captureRunReceipt(h.analytics, "second-private-run", completed);
  expect(h.sent).toHaveLength(5);
});

test("withdrawn consent drops a late run response and no event is replayed on opt-in", async () => {
  const h = harness();
  await h.analytics.setConsent("granted");
  const completed = runReceipt({ status: "completed", startedAt: now });
  await h.analytics.setConsent("denied");
  await captureRunReceipt(h.analytics, "run", completed);
  await h.analytics.setConsent("granted");
  expect(h.sent).toHaveLength(0);
});
