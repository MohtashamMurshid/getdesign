"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MARKDOWN = `# Design System Inspired by Cursor

## 1. Visual Theme & Atmosphere
Warm minimalism meets code-editor elegance.
Off-white canvas, warm-brown text, tight kerning.

## 2. Color Palette
- #26251e — primary text
- #f2f1ed — page background
- #f54e00 — brand accent
- #cf2d56 — semantic error

## 3. Typography
CursorGothic display + Berkeley Mono code.
Letter-spacing scales with size: -2.16px @ 72px.

## 4. Components
Buttons: 8px radius, 1px border, warm shadow.
Inputs: transparent fill, underline on focus.
`;

type Tab = "md" | "ts";

export default function HeroCard() {
  const [tab, setTab] = useState<Tab>("md");

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-100)]">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-200)] px-2 py-2 text-[12px]">
        <TabBtn active={tab === "md"} onClick={() => setTab("md")}>
          design.md
        </TabBtn>
        <TabBtn active={tab === "ts"} onClick={() => setTab("ts")}>
          getdesign.ts
        </TabBtn>
        <span className="ml-auto pr-2 font-mono text-[10.5px] text-[var(--subtle)]">
          cursor.com
        </span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1">
        {tab === "md" ? <MarkdownStream /> : <CodeView />}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-[11px] text-[var(--subtle)]">
        <span className="font-mono">
          {tab === "md" ? "design.md · 9 sections · 14.3KB" : "getdesign.ts · 11 loc"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
          {tab === "md" ? "streaming" : "typed"}
        </span>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-md px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
        active
          ? "bg-[var(--surface-300)] text-foreground"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- design.md: streaming markdown ---------- */

function MarkdownStream() {
  const [chars, setChars] = useState(0);
  const total = MARKDOWN.length;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setChars(0);
    if (timer.current) clearTimeout(timer.current);

    let i = 0;
    const step = () => {
      // burst sizes vary to feel like a real token stream
      const ch = MARKDOWN[i];
      const burst = ch === "\n" ? 1 : Math.random() < 0.3 ? 3 : 2;
      i = Math.min(i + burst, total);
      setChars(i);
      if (i < total) {
        const delay = ch === "\n" ? 45 : 14 + Math.random() * 22;
        timer.current = setTimeout(step, delay);
      }
    };
    timer.current = setTimeout(step, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // keep the scroll pinned to the bottom while streaming
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chars]);

  const shown = MARKDOWN.slice(0, chars);
  const done = chars >= total;

  return (
    <div
      ref={scrollRef}
      className="code-scroll h-full overflow-y-auto px-5 py-4 font-mono text-[12.5px] leading-[1.75]"
    >
      <MarkdownBody text={shown} />
      {!done && <span className="caret" />}
    </div>
  );
}

function MarkdownBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {renderMarkdownLine(line)}
          {/* keep empty lines from collapsing */}
          {line.length === 0 ? "\u00A0" : null}
        </div>
      ))}
    </>
  );
}

function renderMarkdownLine(line: string): React.ReactNode {
  if (line.startsWith("# ")) {
    return <span className="text-foreground">{line}</span>;
  }
  if (line.startsWith("## ")) {
    return <span className="tok-fn">{line}</span>;
  }
  if (line.startsWith("- ")) {
    // "- #hex — comment"
    const m = line.match(/^- (#[0-9a-fA-F]{3,8})(.*)$/);
    if (m) {
      const hex = m[1] ?? "";
      const rest = m[2] ?? "";
      return (
        <>
          <span className="tok-punc">- </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 translate-y-[1px] rounded-[3px] border border-[var(--border-strong)]"
              style={{ background: hex }}
            />
            <span className="tok-str">{hex}</span>
          </span>
          <span className="tok-com">{rest}</span>
        </>
      );
    }
    return <span className="tok-punc">{line}</span>;
  }
  return <span className="text-muted">{line}</span>;
}

/* ---------- getdesign.ts: code view ---------- */

function CodeView() {
  return (
    <pre className="code-scroll h-full overflow-auto px-5 py-4 font-mono text-[12.5px] leading-[1.75]">
      <Ln n={1}>
        <span className="tok-key">import</span>{" "}
        <span className="tok-punc">{"{ "}</span>
        <span className="tok-var">getDesign</span>
        <span className="tok-punc">{" }"}</span>{" "}
        <span className="tok-key">from</span>{" "}
        <span className="tok-str">&quot;@getdesign/sdk&quot;</span>
      </Ln>
      <Ln n={2}>&nbsp;</Ln>
      <Ln n={3}>
        <span className="tok-key">const</span>{" "}
        <span className="tok-var">system</span>{" "}
        <span className="tok-punc">=</span>{" "}
        <span className="tok-key">await</span>{" "}
        <span className="tok-fn">getDesign</span>
        <span className="tok-punc">(</span>
        <span className="tok-str">&quot;cursor.com&quot;</span>
        <span className="tok-punc">)</span>
      </Ln>
      <Ln n={4}>&nbsp;</Ln>
      <Ln n={5}>
        <span className="tok-fn">console</span>
        <span className="tok-punc">.</span>
        <span className="tok-fn">log</span>
        <span className="tok-punc">(</span>
        <span className="tok-var">system</span>
        <span className="tok-punc">.</span>
        <span className="tok-var">markdown</span>
        <span className="tok-punc">)</span>
      </Ln>
      <Ln n={6}>&nbsp;</Ln>
      <Ln n={7}>
        <span className="tok-com">// → # Design System Inspired by Cursor</span>
      </Ln>
      <Ln n={8}>
        <span className="tok-com">// → ## 1. Visual Theme &amp; Atmosphere</span>
      </Ln>
      <Ln n={9}>
        <span className="tok-com">// → ## 2. Color Palette</span>
      </Ln>
      <Ln n={10}>
        <span className="tok-com">// → ## 3. Typography</span>
      </Ln>
      <Ln n={11}>
        <span className="tok-com">// → …6 more sections</span>
      </Ln>
    </pre>
  );
}

function Ln({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-5 shrink-0 text-right text-[var(--subtle)]">{n}</span>
      <span className="flex-1 text-foreground">{children}</span>
    </div>
  );
}
