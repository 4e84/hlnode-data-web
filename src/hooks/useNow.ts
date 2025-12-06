import { useState } from 'react';
import { useInterval } from 'react-use';

/**
 * Returns current timestamp that updates at the specified interval.
 * Only ticks when enabled (default: true).
 */
export function useNow(interval: number = 1000, enabled: boolean = true): number {
  const [now, setNow] = useState(Date.now());

  useInterval(
    () => setNow(Date.now()),
    enabled ? interval : null // null disables the interval
  );

  return now;
}
