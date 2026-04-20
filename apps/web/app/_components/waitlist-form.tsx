"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type WaitlistFormProps = {
  variant?: "hero" | "compact";
};

export default function WaitlistForm({
  variant = "hero",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isCompact = variant === "compact";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus("success");
      setMessage("You're on the list. We'll be in touch.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  return (
    <div className={isCompact ? "w-full max-w-md" : "mx-auto w-full max-w-md"}>
      <form
        onSubmit={onSubmit}
        className="flex items-stretch gap-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-100)] p-1"
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <span className="font-mono text-xs text-[var(--accent)]">{">"}</span>
          <input
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@domain.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") {
                setStatus("idle");
              }
              if (message) {
                setMessage(null);
              }
            }}
            disabled={status === "loading"}
            className="h-9 w-full bg-transparent text-[13.5px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none disabled:opacity-60"
            aria-label="Email address"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="btn-primary inline-flex h-9 items-center rounded-md px-4 text-[12.5px] font-medium disabled:opacity-70"
        >
          {status === "loading"
            ? "Joining…"
            : status === "success"
              ? "Joined ✓"
              : "Join waitlist"}
        </button>
      </form>

      {message ? (
        <div
          className={`mt-2 text-[11.5px] ${
            status === "error" ? "text-[#f87171]" : "text-[var(--accent)]"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
