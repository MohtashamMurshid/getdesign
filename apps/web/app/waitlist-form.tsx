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
    <div className={compact ? "w-full max-w-md" : "mx-auto w-full max-w-md"}>
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
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
