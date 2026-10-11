import { useEffect, useState } from 'react';

function msToMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** Human-readable time left until the next local midnight, e.g. "5h 12m". */
export function useMidnightCountdown() {
  const [ms, setMs] = useState(msToMidnight);
  useEffect(() => {
    const id = setInterval(() => setMs(msToMidnight()), 20_000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
