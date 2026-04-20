"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm({
  variant = "hero",
}: {
  variant?: "hero" | "compact";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setMessage("You're on the list. We'll be in touch.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const compact = variant === "compact";

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "flex w-full max-w-md items-stretch gap-0 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-100)] p-1"
          : "mx-auto flex w-full max-w-md items-stretch gap-0 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-100)] p-1"
      }
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <span className="text-xs text-[var(--accent)]">{">"}</span>
        <input
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          disabled={status === "loading"}
          className="h-10 w-full bg-transparent text-[14px] text-foreground placeholder:text-[var(--subtle)] focus:outline-none disabled:opacity-60"
          aria-label="Email address"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="btn-accent inline-flex h-10 items-center rounded-md px-4 text-[13px] font-medium disabled:opacity-70"
      >
        {status === "loading"
          ? "Joining…"
          : status === "success"
          ? "Joined ✓"
          : "Join waitlist"}
      </button>

      {message ? (
        <div
          className={`absolute mt-12 text-xs ${
            status === "error" ? "text-[#ff6d7a]" : "text-[var(--accent)]"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
