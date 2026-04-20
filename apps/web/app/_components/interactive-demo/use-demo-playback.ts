"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseDemoPlaybackOptions = {
  totalSteps: number;
  delay?: number;
  startDelay?: number;
};

export function useDemoPlayback({
  totalSteps,
  delay = 620,
  startDelay = 280,
}: UseDemoPlaybackOptions) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPlayback = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(
    (initialDelay = startDelay) => {
      clearPlayback();
      setVisibleSteps(0);

      const tick = (nextStep: number) => {
        setVisibleSteps(nextStep);

        if (nextStep < totalSteps) {
          timerRef.current = setTimeout(() => tick(nextStep + 1), delay);
        }
      };

      timerRef.current = setTimeout(() => tick(1), initialDelay);
    },
    [clearPlayback, delay, startDelay, totalSteps],
  );

  useEffect(() => {
    startPlayback();
    return clearPlayback;
  }, [clearPlayback, startPlayback]);

  return {
    visibleSteps,
    done: visibleSteps >= totalSteps,
    restart: () => startPlayback(200),
    clearPlayback,
  };
}
