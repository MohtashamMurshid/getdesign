"use client";

import { useState } from "react";

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL.");
      return;
    }
    let candidate = trimmed;
    if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setError("URL must be http or https.");
        return;
      }
    } catch {
      setError("That doesn't look like a URL.");
      return;
    }
    // Backend not wired yet. Stub: show it worked.
    setError(null);
    alert(`Coming soon: will generate design.md for ${candidate}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row sm:gap-0"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
          https://
        </span>
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="cursor.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background pl-[74px] pr-4 text-[15px] text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none sm:rounded-r-none"
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-xl border border-foreground bg-foreground px-5 text-[15px] font-medium text-background transition-colors hover:bg-error hover:border-error sm:rounded-l-none"
      >
        Generate design.md
      </button>
      {error ? (
        <div className="absolute mt-14 text-sm text-error">{error}</div>
      ) : null}
    </form>
  );
}
