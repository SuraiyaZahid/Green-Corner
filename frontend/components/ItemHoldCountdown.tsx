'use client';

import { useEffect, useState } from 'react';

/** Formats the remaining seconds as m:ss. */
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The time left on a single cart line before its stock is released again.
 *
 * The countdown is deliberately quiet — it only turns amber in the last
 * minute so the shopper is nudged to check out without being nagged.
 */
export function ItemHoldCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const deadline = new Date(expiresAt).getTime();

    const tick = () => {
      setRemaining(deadline - Date.now());
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (remaining === null) return null;

  const expired = remaining <= 0;
  const urgent = !expired && remaining <= 60_000;

  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        expired
          ? 'text-red-600'
          : urgent
            ? 'text-amber-600'
            : 'text-gray-400'
      }`}
      data-testid="item-hold-countdown"
    >
      {expired ? 'Expired' : `Held ${formatRemaining(remaining)}`}
    </span>
  );
}

export default ItemHoldCountdown;
