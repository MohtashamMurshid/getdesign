"use client";

import { useEffect, useState } from "react";

import { EASINGS } from "./design-data";
import { Caption } from "./design-primitives";

export function MotionSection() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
      {EASINGS.map((easing) => (
        <div key={easing.name} className="bg-[var(--surface-100)] p-6">
          <Caption>{easing.name}</Caption>
          <div className="mt-6 flex h-12 items-center gap-3">
            {easing.name === "pulse" ? (
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
            ) : (
              <MotionDemo easing={easing.curve} />
            )}
          </div>
          <p className="mt-6 font-mono text-[10.5px] text-[var(--accent)]">
            {easing.curve}
          </p>
          <p className="mt-1 text-[12px] text-muted">{easing.note}</p>
        </div>
      ))}
    </div>
  );
}

function MotionDemo({ easing }: { easing: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExpanded((value) => !value);
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="inline-block h-2 rounded-full bg-[var(--accent)]"
      style={{
        width: isExpanded ? 96 : 12,
        transition: `width 520ms ${easing}`,
      }}
    />
  );
}
