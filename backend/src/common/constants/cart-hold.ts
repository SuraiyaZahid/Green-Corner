/**
 * How long a product stays reserved in a customer's cart.
 *
 * A cart line is a *reservation*, not a decrement: the stock is only taken
 * out of the pool when the order is placed. To stop abandoned carts from
 * hoarding stock forever, every cart line carries an expiry timestamp and
 * is purged once it passes, which releases the reserved units again.
 */
export const CART_HOLD_MINUTES = 3;

/** The hold window in milliseconds. */
export const CART_HOLD_MS = CART_HOLD_MINUTES * 60 * 1000;

/** How often the background sweep looks for expired cart lines. */
export const SWEEP_INTERVAL_MS = 30_000;

/** The moment a cart line stops holding its stock. */
export function cartExpiryFromNow(now = new Date()): Date {
  return new Date(now.getTime() + CART_HOLD_MS);
}
