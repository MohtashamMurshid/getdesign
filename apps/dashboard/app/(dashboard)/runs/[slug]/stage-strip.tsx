"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import type { Phase } from "./run-progress";

const STEPS: Array<{ id: Phase; label: string }> = [
  { id: "kickoff", label: "Kickoff" },
  { id: "crawl", label: "Crawl" },
  { id: "capture", label: "Capture" },
  { id: "extract", label: "Extract" },
  { id: "describe", label: "Describe" },
  { id: "synthesize", label: "Synthesize" },
  { id: "render", label: "Render" },
  { id: "completed", label: "Done" },
];

export function StageStrip({ phase }: { phase: Phase }) {
  const activeIndex = STEPS.findIndex((s) => s.id === phase);
  const failed = phase === "failed";

  return (
    <div className="w-full">
      <ol className="flex w-full items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const completed = !failed && activeIndex > i;
          const active = !failed && activeIndex === i;
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div className="relative flex w-full items-center">
                {i > 0 ? (
                  <div
                    className={cn(
                      "absolute left-0 right-1/2 h-px transition-colors",
                      completed || active
                        ? "bg-foreground/40"
                        : "bg-border",
                    )}
                  />
                ) : null}
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "absolute left-1/2 right-0 h-px transition-colors",
                      completed ? "bg-foreground/40" : "bg-border",
                    )}
                  />
                ) : null}

                <div className="relative z-[1] mx-auto">
                  {active ? (
                    <motion.div
                      layout
                      className="size-2.5 rounded-full bg-foreground"
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ) : (
                    <div
                      className={cn(
                        "size-2.5 rounded-full transition-colors",
                        completed
                          ? "bg-foreground/70"
                          : "border border-border bg-background",
                      )}
                    />
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "truncate font-mono text-[9px] uppercase tracking-wider transition-colors",
                  active
                    ? "text-foreground"
                    : completed
                      ? "text-foreground/70"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
