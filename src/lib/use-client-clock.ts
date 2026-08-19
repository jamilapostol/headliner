"use client";

import { useEffect, useState } from "react";

/**
 * The current time, measured only on the client.
 *
 * Returns null until mounted, and callers render their neutral state until
 * it resolves. That is deliberate: the server has no idea what the device's
 * clock or timezone says, so anything time-local decided during SSR would
 * be both wrong and a hydration mismatch. Null means "not measured yet",
 * which is honest, rather than a server guess dressed up as an answer.
 *
 * Re-reads on an interval AND whenever the tab becomes visible. The
 * visibility half is the one that matters: a tour device is woken at the
 * next venue after sleeping in a pocket, and that is exactly the moment a
 * stale clock starts filing money against the wrong night.
 */
export function useClientClock(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(tick, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
