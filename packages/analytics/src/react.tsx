"use client";

import { useEffect, useState, type AnchorHTMLAttributes } from "react";
import { getAnalytics } from "./client";
import type { Cta, Surface } from "./schema";

export function AnalyticsConsent({ surface }: { surface: Surface }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [, redraw] = useState(0);
  const analytics = getAnalytics(surface);
  useEffect(() => {
    setMounted(true);
    const unsubscribe = analytics.subscribe(() => redraw((value) => value + 1));
    void analytics.sync();
    const refresh = () => {
      void analytics.sync();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [analytics]);
  if (!mounted || !analytics.configured) return null;
  return (
    <aside
      aria-label="Analytics privacy"
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 60,
        maxWidth: 340,
        padding: 12,
        border: "1px solid var(--border, #888)",
        borderRadius: 8,
        background: "var(--background, white)",
        color: "var(--foreground, #111)",
        fontSize: 12,
      }}
    >
      {open ? (
        <>
          <p>
            Allow optional product analytics? PostHog uses a cookie to connect
            your clicks, signup, runs, and downloads across this site and the
            dashboard. We do not send URLs, keys, emails, generated content, or
            recordings.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                void analytics.setConsent("granted");
                setOpen(false);
              }}
            >
              Allow analytics
            </button>
            <button
              type="button"
              onClick={() => {
                void analytics.setConsent("denied");
                setOpen(false);
              }}
            >
              Reject analytics
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          Analytics {analytics.allowed() ? "on" : "off"}. Privacy settings
        </button>
      )}
    </aside>
  );
}

/** Explicit link instrumentation. No DOM text, href, or query data reaches capture. */
export function AnalyticsLink({
  cta,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { cta: Cta }) {
  return (
    <a
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented)
          getAnalytics("marketing").capture({
            event: "cta_clicked",
            properties: { cta },
          });
      }}
    />
  );
}
