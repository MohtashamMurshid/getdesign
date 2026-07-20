"use client";

import { useEffect, useState } from "react";

type UseDemoPlaybackOptions = {
  totalSteps: number;
  delay?: number;
  startDelay?: number;
};

/**
 * Auto-advances visibleSteps from 0 → totalSteps.
 * Remount (via React key) to restart playback after site/surface changes.
 */
export function useDemoPlayback({
  totalSteps,
  delay = 620,
  startDelay = 280,
}: UseDemoPlaybackOptions) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const tick = (nextStep: number) => {
      setVisibleSteps(nextStep);

      if (nextStep < totalSteps) {
        timers.push(setTimeout(() => tick(nextStep + 1), delay));
      }
    };

    timers.push(setTimeout(() => tick(1), startDelay));

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [delay, startDelay, totalSteps]);

  return {
    visibleSteps,
    done: visibleSteps >= totalSteps,
  };
}
