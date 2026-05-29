"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateCredentialsAction } from "../actions";
import { INITIAL_SETTINGS_STATE } from "../actions-state";

type FieldStatus = { set: boolean; hint?: string };

type SettingsFormProps = {
  daytona: FieldStatus;
  openai: FieldStatus;
};

export function SettingsForm({ daytona, openai }: SettingsFormProps) {
  const [state, formAction] = useActionState(
    updateCredentialsAction,
    INITIAL_SETTINGS_STATE,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.2em] text-[var(--subtle)]">
          BYOK credentials
        </div>
        <div className="font-mono text-[10.5px] text-[var(--subtle)]">
          encrypted · WorkOS Vault
        </div>
      </div>

      <CredentialField
        id="daytonaApiKey"
        label="Daytona API key"
        placeholder="dt_live_..."
        status={daytona}
        clearIntent="clear-daytona"
        helper={
          <>
            Launches the capture sandbox. Get one at{" "}
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
      />

      <CredentialField
        id="openaiApiKey"
        label="OpenAI API key"
        placeholder="sk-..."
        status={openai}
        clearIntent="clear-openai"
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
      />

      {state.status !== "idle" && state.message ? (
        <div
          role="status"
          className={`mt-1 rounded-md border px-3 py-2 text-[12px] ${
            state.status === "ok"
              ? "border-[var(--border-strong)] text-foreground"
              : "border-red-500/40 text-red-400"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-2">
        <SaveButton />
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--subtle)]">
        Keys are encrypted at rest in WorkOS Vault, scoped to your account, and
        only ever decrypted server-side to run your designs. They are never sent
        back to the browser.
      </p>
    </form>
  );
}

type CredentialFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  status: FieldStatus;
  clearIntent: string;
  helper: React.ReactNode;
};

function CredentialField({
  id,
  label,
  placeholder,
  status,
  clearIntent,
  helper,
}: CredentialFieldProps) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-[11px] uppercase tracking-[0.16em] text-[var(--subtle)]"
        >
          {label}
        </label>
        {status.set ? (
          <span className="font-mono text-[10.5px] text-[var(--accent)]">
            saved · {status.hint}
          </span>
        ) : (
          <span className="font-mono text-[10.5px] text-[var(--subtle)]">
            not set
          </span>
        )}
      </div>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={status.set ? "•••••••• (leave blank to keep)" : placeholder}
        className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--background)] px-3 font-mono text-[13px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--border-strong)]"
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <div className="text-[11.5px] text-[var(--subtle)]">{helper}</div>
        {status.set ? (
          <button
            type="submit"
            name="intent"
            value={clearIntent}
            className="btn-ghost shrink-0 rounded-md px-2 py-1 text-[11px] text-[var(--subtle)] hover:text-foreground"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="intent"
      value="save"
      disabled={pending}
      className="btn-accent inline-flex h-9 items-center rounded-md px-4 text-[12.5px] font-medium disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save keys"}
    </button>
  );
}
