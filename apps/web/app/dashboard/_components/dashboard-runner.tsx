"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DesignStreamEvent } from "@getdesign/sdk";

import { PhaseList } from "./phase-list";
import { ResultViewer } from "./result-viewer";
import type {
  DashboardAccess,
  DashboardResult,
  DashboardStatus,
  PhaseId,
  PhaseState,
} from "./types";

const INITIAL_PHASES: Record<PhaseId, PhaseState> = {
  crawl: "pending",
  capture: "pending",
  visual: "pending",
  describe: "pending",
  extract: "pending",
  synthesize: "pending",
  render: "pending",
};

const KEY_STORAGE = {
  daytona: "getdesign.dashboard.daytonaKey",
  openai: "getdesign.dashboard.openaiKey",
} as const;

type FormState = {
  url: string;
  siteName: string;
  daytonaApiKey: string;
  openaiApiKey: string;
  rememberKeys: boolean;
};

const INITIAL_FORM: FormState = {
  url: "",
  siteName: "",
  daytonaApiKey: "",
  openaiApiKey: "",
  rememberKeys: false,
};

export function DashboardRunner({ access }: { access: DashboardAccess }) {
  const daytonaFromServer = access.stored.daytona || access.env.daytona;
  const openaiFromServer = access.stored.openai || access.env.openai;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<DashboardStatus>("idle");
  const [phases, setPhases] = useState<Record<PhaseId, PhaseState>>(
    INITIAL_PHASES,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DashboardResult | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);

  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const daytona = window.localStorage.getItem(KEY_STORAGE.daytona) ?? "";
      const openai = window.localStorage.getItem(KEY_STORAGE.openai) ?? "";
      if (daytona || openai) {
        setForm((prev) => ({
          ...prev,
          daytonaApiKey: daytona,
          openaiApiKey: openai,
          rememberKeys: Boolean(daytona || openai),
        }));
      }
    } catch {
      // Local storage may be unavailable; ignore.
    }
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsed(Date.now() - startedAtRef.current);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const handleField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const persistKeys = useCallback((next: FormState) => {
    if (typeof window === "undefined") return;
    try {
      if (next.rememberKeys) {
        window.localStorage.setItem(KEY_STORAGE.daytona, next.daytonaApiKey);
        window.localStorage.setItem(KEY_STORAGE.openai, next.openaiApiKey);
      } else {
        window.localStorage.removeItem(KEY_STORAGE.daytona);
        window.localStorage.removeItem(KEY_STORAGE.openai);
      }
    } catch {
      // Ignore.
    }
  }, []);

  const applyEvent = useCallback((event: DesignStreamEvent) => {
    if (event.type === "result") {
      setResult(event.result);
      setStatus("done");
      setPhases((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next) as PhaseId[]) {
          if (next[key] !== "error") next[key] = "ok";
        }
        return next;
      });
      return;
    }

    if (event.type === "error") {
      setStatus("error");
      setErrorMessage(
        event.error.reason ?? event.error.error ?? "Run failed.",
      );
      setPhases((prev) => {
        const next = { ...prev };
        let markedError = false;
        for (const key of Object.keys(next) as PhaseId[]) {
          if (next[key] === "running") {
            next[key] = "error";
            markedError = true;
          }
        }
        if (!markedError) {
          for (const key of Object.keys(next) as PhaseId[]) {
            if (next[key] === "pending") {
              next[key] = "error";
              markedError = true;
              break;
            }
          }
        }
        return next;
      });
      return;
    }

    if (event.type !== "progress") return;

    const phaseId = event.event.phase as PhaseId;
    setPhases((prev) => {
      if (!(phaseId in prev)) return prev;
      const next = { ...prev };
      if (event.event.status === "ok") {
        next[phaseId] = "ok";
      } else if (event.event.status === "start") {
        next[phaseId] = "running";
      } else {
        if (next[phaseId] === "pending") next[phaseId] = "running";
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setPhases(INITIAL_PHASES);
    setErrorMessage(null);
    setResult(null);
    setElapsed(0);
    startedAtRef.current = null;
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (status === "running") return;

      const url = form.url.trim();
      const daytona = form.daytonaApiKey.trim();
      const openai = form.openaiApiKey.trim();

      if (!url) {
        setStatus("error");
        setErrorMessage("Enter a URL to design.");
        return;
      }

      const daytonaReady = Boolean(daytona) || daytonaFromServer;
      const openaiReady = Boolean(openai) || openaiFromServer;
      if (!daytonaReady || !openaiReady) {
        const missing = [
          !daytonaReady ? "Daytona" : null,
          !openaiReady ? "OpenAI" : null,
        ]
          .filter(Boolean)
          .join(" and ");
        setStatus("error");
        setErrorMessage(
          `Provide your ${missing} key${missing.includes("and") ? "s" : ""}, or save ${missing.includes("and") ? "them" : "it"} in Settings.`,
        );
        return;
      }

      persistKeys(form);

      setStatus("running");
      setPhases(INITIAL_PHASES);
      setErrorMessage(null);
      setResult(null);
      setElapsed(0);
      startedAtRef.current = Date.now();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/design", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            url,
            siteName: form.siteName.trim() || undefined,
            daytonaApiKey: daytona || undefined,
            openaiApiKey: openai || undefined,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            reason?: string;
            error?: string;
          };
          throw new Error(
            payload.reason ?? payload.error ?? `Request failed (${response.status}).`,
          );
        }

        const body = response.body;
        if (!body) throw new Error("Empty response from server.");

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
              try {
                const event = JSON.parse(line) as DesignStreamEvent;
                applyEvent(event);
              } catch {
                // Ignore malformed lines.
              }
            }
            newlineIndex = buffer.indexOf("\n");
          }
        }

        const tail = buffer.trim();
        if (tail) {
          try {
            applyEvent(JSON.parse(tail) as DesignStreamEvent);
          } catch {
            // Ignore.
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Run failed.",
        );
        setPhases((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next) as PhaseId[]) {
            if (next[key] === "running") next[key] = "error";
          }
          return next;
        });
      } finally {
        abortRef.current = null;
      }
    },
    [applyEvent, daytonaFromServer, form, openaiFromServer, persistKeys, status],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (status === "running") {
      setStatus("error");
      setErrorMessage("Run cancelled.");
      setPhases((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next) as PhaseId[]) {
          if (next[key] === "running") next[key] = "error";
        }
        return next;
      });
    }
  }, [status]);

  const isRunning = status === "running";

  return (
    <section className="px-6 pb-24 pt-10">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[10.5px] uppercase tracking-[0.2em] text-[var(--subtle)]">
              New run
            </div>
            <div className="font-mono text-[10.5px] text-[var(--subtle)]">
              getDesign
            </div>
          </div>

          <Field
            id="url"
            label="URL"
            helper="Public landing page rendered in a real browser."
          >
            <div className="flex items-stretch rounded-md border border-[var(--border-strong)] bg-[var(--background)]">
              <span className="flex items-center pl-3 font-mono text-[12px] text-[var(--accent)]">
                {">"}
              </span>
              <input
                id="url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://linear.app"
                spellCheck={false}
                value={form.url}
                onChange={(e) => handleField("url", e.target.value)}
                disabled={isRunning}
                required
                className="h-10 w-full bg-transparent px-3 font-mono text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none disabled:opacity-60"
              />
            </div>
          </Field>

          <Field
            id="siteName"
            label="Site name"
            helper="Optional. Defaults to the hostname."
          >
            <input
              id="siteName"
              type="text"
              placeholder="Linear"
              value={form.siteName}
              onChange={(e) => handleField("siteName", e.target.value)}
              disabled={isRunning}
              className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--background)] px-3 text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--border-strong)] disabled:opacity-60"
            />
          </Field>

          <div className="my-5 dashed-top h-px" />

          <CredentialBanner access={access} />

          <div className="mb-3 flex items-center justify-between text-[10.5px] uppercase tracking-[0.2em] text-[var(--subtle)]">
            <span>BYOK credentials</span>
            <span className="font-mono normal-case tracking-normal text-[var(--subtle)]">
              {daytonaFromServer && openaiFromServer
                ? "optional override"
                : "never persisted server-side"}
            </span>
          </div>

          <Field
            id="daytonaApiKey"
            label="Daytona API key"
            helper={
              <>
                Used to launch the capture sandbox. Get one at{" "}
                <a
                  href="https://app.daytona.io/dashboard/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  app.daytona.io
                </a>
                .
              </>
            }
          >
            <input
              id="daytonaApiKey"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={daytonaFromServer ? "Using saved key — override here" : "dt_live_..."}
              value={form.daytonaApiKey}
              onChange={(e) => handleField("daytonaApiKey", e.target.value)}
              disabled={isRunning}
              className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--background)] px-3 font-mono text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--border-strong)] disabled:opacity-60"
            />
          </Field>

          <Field
            id="openaiApiKey"
            label="OpenAI API key"
            helper={
              <>
                Used for visual description and synthesis. Get one at{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  platform.openai.com
                </a>
                .
              </>
            }
          >
            <input
              id="openaiApiKey"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={openaiFromServer ? "Using saved key — override here" : "sk-..."}
              value={form.openaiApiKey}
              onChange={(e) => handleField("openaiApiKey", e.target.value)}
              disabled={isRunning}
              className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--background)] px-3 font-mono text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--border-strong)] disabled:opacity-60"
            />
          </Field>

          <label className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--subtle)]">
            <input
              type="checkbox"
              checked={form.rememberKeys}
              onChange={(e) => handleField("rememberKeys", e.target.checked)}
              disabled={isRunning}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            Remember keys in this browser
          </label>

          <div className="mt-6 flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={cancel}
                className="btn-ghost inline-flex h-9 items-center rounded-md px-3 text-[12.5px]"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={reset}
                disabled={status === "idle"}
                className="btn-ghost inline-flex h-9 items-center rounded-md px-3 text-[12.5px] disabled:opacity-40"
              >
                Reset
              </button>
            )}
            <button
              type="submit"
              disabled={isRunning}
              className="btn-accent inline-flex h-9 items-center rounded-md px-4 text-[12.5px] font-medium disabled:opacity-60"
            >
              {isRunning ? "Generating…" : "Generate design.md"}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <div className="text-[10.5px] uppercase tracking-[0.2em] text-[var(--subtle)]">
              Progress
            </div>
            <div className="font-mono text-[10.5px] text-[var(--subtle)]">
              {status === "idle" && "idle"}
              {status === "running" && `${formatElapsed(elapsed)}`}
              {status === "done" && `done · ${formatElapsed(elapsed)}`}
              {status === "error" && "error"}
            </div>
          </div>
          <PhaseList phases={phases} errorMessage={errorMessage} />
        </div>
      </div>

      <div className="mt-8">
        {result ? (
          <ResultViewer result={result} />
        ) : (
          <EmptyResult status={status} />
        )}
      </div>
    </section>
  );
}

function EmptyResult({ status }: { status: DashboardStatus }) {
  const label =
    status === "running"
      ? "Streaming events. The design.md will appear here when synthesis finishes."
      : status === "error"
        ? "Run did not finish. Fix the error above and try again."
        : "Run a URL to see the generated design.md here.";

  return (
    <div className="dashed-frame rounded-xl bg-[var(--surface-100)] px-6 py-16 text-center">
      <div className="mx-auto max-w-md text-[13px] text-muted">{label}</div>
    </div>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

function CredentialBanner({ access }: { access: DashboardAccess }) {
  const bothStored = access.stored.daytona && access.stored.openai;
  const bothEnv = access.env.daytona && access.env.openai;

  let message: React.ReactNode;
  let action: React.ReactNode = null;

  if (access.workosConfigured && access.userEmail) {
    message = bothStored ? (
      <>
        Using your saved keys for{" "}
        <span className="text-foreground">{access.userEmail}</span>. Leave the
        fields blank, or override below.
      </>
    ) : (
      <>
        Signed in as{" "}
        <span className="text-foreground">{access.userEmail}</span>. Save your
        keys once so you don&apos;t paste them every run.
      </>
    );
    action = (
      <a
        href="/dashboard/settings"
        className="btn-ghost shrink-0 rounded-md px-3 py-1.5 text-[11.5px]"
      >
        Settings
      </a>
    );
  } else if (access.workosConfigured) {
    message = <>Sign in to securely store your keys in WorkOS Vault and reuse them.</>;
    action = (
      <a
        href="/login"
        className="btn-ghost shrink-0 rounded-md px-3 py-1.5 text-[11.5px]"
      >
        Sign in
      </a>
    );
  } else if (bothEnv) {
    message = (
      <>
        Local keys detected from environment variables. Run without entering
        anything, or override below.
      </>
    );
  } else {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2.5 text-[11.5px] text-muted">
      <span>{message}</span>
      {action}
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  helper?: React.ReactNode;
  children: React.ReactNode;
};

function Field({ id, label, helper, children }: FieldProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-[var(--subtle)]"
      >
        {label}
      </label>
      {children}
      {helper ? (
        <div className="mt-1.5 text-[11.5px] text-[var(--subtle)]">
          {helper}
        </div>
      ) : null}
    </div>
  );
}
