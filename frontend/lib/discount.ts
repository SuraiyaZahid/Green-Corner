/**
 * Store-wide discount helpers for the storefront.
 *
 * The server always resolves the discount and sends the final prices down
 * with the cart and product payloads. These helpers exist so the UI can
 * format those values consistently — the maths is never re-derived from a
 * percentage the browser received, because that could drift from what the
 * customer is actually charged.
 */

/** The label shown on a discount badge, e.g. "15% OFF". */
export function discountLabel(percentage: number): string {
  return `${percentage}% OFF`;
}

/** Whether a discount is currently in force. */
export function hasDiscount(percentage: number): boolean {
  return percentage > 0;
}
