"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·/?#@";

function randomGlyph() {
  return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
}

/**
 * Renders `text` by progressively replacing scrambled glyphs with the real
 * characters from left to right. Whitespace is preserved as-is so word shape
 * stays roughly readable even mid-scramble.
 */
export function ScrambleText({
  text,
  duration = 600,
  startDelay = 0,
  className,
}: {
  text: string;
  duration?: number;
  startDelay?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(() => scrambleAll(text));
  const lastTextRef = useRef(text);

  useEffect(() => {
    lastTextRef.current = text;
    // Intentional: reset display when the text input changes so the scramble
    // restarts from a fully-scrambled frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplay(scrambleAll(text));

    let raf = 0;
    let startTs = 0;

    const tick = (ts: number) => {
      if (!startTs) startTs = ts + startDelay;
      const elapsed = ts - startTs;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      // Reveal proportional to t; characters before the cursor are real, after are scrambled.
      const cursor = Math.floor(text.length * t);
      let next = "";
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i]!;
        if (/\s/.test(ch)) {
          next += ch;
          continue;
        }
        if (i < cursor) next += ch;
        else next += randomGlyph();
      }
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, startDelay]);

  return <span className={className}>{display}</span>;
}

function scrambleAll(text: string) {
  let out = "";
  for (const ch of text) {
    out += /\s/.test(ch) ? ch : randomGlyph();
  }
  return out;
}
