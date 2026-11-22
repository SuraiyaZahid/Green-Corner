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
 * A subtle notice above the cart lines explaining that the items are only
 * held for a short while before the stock is released again.
 *
 * The countdown tracks the line that expires first, so the shopper sees the
 * moment their hold runs out rather than a static number that drifts out
 * of sync with the server.
 */
export function CartExpiryNotice({
  expiresAt,
  holdMinutes,
  onExpire,
}: {
  /** The expiry of the line that runs out first. */
  expiresAt: string | null;
  /** How long a line holds its stock, in minutes. */
  holdMinutes: number;
  /** Called once the countdown reaches zero. */
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const deadline = new Date(expiresAt).getTime();

    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0) {
        onExpire?.();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!expiresAt || remaining === null) {
    return null;
  }

  const expired = remaining <= 0;
  // Under a minute left reads as urgent, so the notice shifts colour.
  const urgent = !expired && remaining <= 60_000;

  return (
    <p
      className={`mt-3 flex flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${
        expired
          ? 'border-red-200 bg-red-50 text-red-700'
          : urgent
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}
      data-testid="cart-expiry-notice"
    >
      <span aria-hidden="true">⏳</span>
      {expired ? (
        <span className="font-medium">
          An item has expired and was released back to stock.
        </span>
      ) : (
        <span>
          Items in cart are held for {holdMinutes} minutes before
          auto-releasing —{' '}
          <span className="font-semibold tabular-nums">
            {formatRemaining(remaining)}
          </span>{' '}
          left
        </span>
      )}
    </p>
  );
}

export default CartExpiryNotice;
