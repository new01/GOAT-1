"use client";

import { useState, useEffect } from "react";

/**
 * Hook that computes elapsed time from a start timestamp.
 *
 * @param startedAt - Epoch milliseconds when the timer started. null/undefined = "0:00".
 * @returns { elapsed: string, seconds: number }
 *   - elapsed: formatted as "M:SS" (e.g., "0:00", "1:47", "12:30")
 *   - seconds: raw elapsed seconds (0 when not started)
 */
export function useTimer(startedAt: number | null | undefined): {
  elapsed: string;
  seconds: number;
} {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt == null) return;

    // Sync immediately
    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (startedAt == null) {
    return { elapsed: "0:00", seconds: 0 };
  }

  const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const elapsed = `${minutes}:${secs.toString().padStart(2, "0")}`;

  return { elapsed, seconds: totalSeconds };
}
