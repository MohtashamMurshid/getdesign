"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MARKDOWN = `# Design System Inspired by Cursor

## 1. Visual Theme & Atmosphere
Warm minimalism meets code-editor elegance.
Off-white canvas, warm-brown text, tight kerning.

## 2. Color Palette
- #26251e · primary text
- #f2f1ed · page background
- #f54e00 · brand accent
- #cf2d56 · semantic error

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
      <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-200)] px-2 py-2 text-[12px]">
        <TabButton active={tab === "md"} onClick={() => setTab("md")}>
          design.md
        </TabButton>
        <TabButton active={tab === "ts"} onClick={() => setTab("ts")}>
          getdesign.ts
        </TabButton>
        <span className="ml-auto pr-2 font-mono text-[10.5px] text-[var(--subtle)]">
          cursor.com
        </span>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "md" ? <MarkdownStream /> : <CodeView />}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-200)] px-3 py-2 text-[11px] text-[var(--subtle)]">
        <span className="font-mono">
          {tab === "md"
            ? "design.md · 9 sections · 14.3KB"
            : "getdesign.ts · 11 loc"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {tab === "md" ? "streaming" : "typed"}
        </span>
      </div>
    </div>
  );
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function TabButton({ active, onClick, children }: TabButtonProps) {
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

function MarkdownStream() {
  const [visibleChars, setVisibleChars] = useState(0);
  const totalChars = MARKDOWN.length;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisibleChars(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    let index = 0;
    const step = () => {
      const currentChar = MARKDOWN[index];
      const burst = currentChar === "\n" ? 1 : Math.random() < 0.3 ? 3 : 2;
      index = Math.min(index + burst, totalChars);
      setVisibleChars(index);

      if (index < totalChars) {
        const delay =
          currentChar === "\n" ? 45 : 14 + Math.random() * 22;
        timerRef.current = setTimeout(step, delay);
      }
    };

    timerRef.current = setTimeout(step, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [totalChars]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [visibleChars]);

  const visibleText = MARKDOWN.slice(0, visibleChars);
  const finished = visibleChars >= totalChars;

  return (
    <div
      ref={scrollRef}
      className="code-scroll h-full overflow-y-auto px-5 py-4 font-mono text-[12.5px] leading-[1.75]"
    >
      <MarkdownBody text={visibleText} />
      {!finished ? <span className="caret" /> : null}
    </div>
  );
}

function MarkdownBody({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <div key={index} className="whitespace-pre-wrap">
          {renderMarkdownLine(line)}
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
    const match = line.match(/^- (#[0-9a-fA-F]{3,8})(.*)$/);
    if (match) {
      const hex = match[1] ?? "";
      const rest = match[2] ?? "";

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

function CodeView() {
  return (
    <pre className="code-scroll h-full overflow-auto px-5 py-4 font-mono text-[12.5px] leading-[1.75]">
      <LineNumber n={1}>
        <span className="tok-key">import</span>{" "}
        <span className="tok-punc">{"{ "}</span>
        <span className="tok-var">getDesign</span>
        <span className="tok-punc">{" }"}</span>{" "}
        <span className="tok-key">from</span>{" "}
        <span className="tok-str">&quot;@getdesign/sdk&quot;</span>
      </LineNumber>
      <LineNumber n={2}>&nbsp;</LineNumber>
      <LineNumber n={3}>
        <span className="tok-key">const</span>{" "}
        <span className="tok-var">system</span>{" "}
        <span className="tok-punc">=</span>{" "}
        <span className="tok-key">await</span>{" "}
        <span className="tok-fn">getDesign</span>
        <span className="tok-punc">(</span>
        <span className="tok-str">&quot;cursor.com&quot;</span>
        <span className="tok-punc">)</span>
      </LineNumber>
      <LineNumber n={4}>&nbsp;</LineNumber>
      <LineNumber n={5}>
        <span className="tok-fn">console</span>
        <span className="tok-punc">.</span>
        <span className="tok-fn">log</span>
        <span className="tok-punc">(</span>
        <span className="tok-var">system</span>
        <span className="tok-punc">.</span>
        <span className="tok-var">markdown</span>
        <span className="tok-punc">)</span>
      </LineNumber>
      <LineNumber n={6}>&nbsp;</LineNumber>
      <LineNumber n={7}>
        <span className="tok-com">// → # Design System Inspired by Cursor</span>
      </LineNumber>
      <LineNumber n={8}>
        <span className="tok-com">// → ## 1. Visual Theme &amp; Atmosphere</span>
      </LineNumber>
      <LineNumber n={9}>
        <span className="tok-com">// → ## 2. Color Palette</span>
      </LineNumber>
      <LineNumber n={10}>
        <span className="tok-com">// → ## 3. Typography</span>
      </LineNumber>
      <LineNumber n={11}>
        <span className="tok-com">// → …6 more sections</span>
      </LineNumber>
    </pre>
  );
}

function LineNumber({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="w-5 shrink-0 text-right text-[var(--subtle)]">{n}</span>
      <span className="flex-1 text-foreground">{children}</span>
    </div>
  );
}
