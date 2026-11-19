/**
 * Store-wide discount maths.
 *
 * This is the single source of truth for how a percentage off is turned into
 * money. The cart, the order and the API responses all use it so a price can
 * never be shown one way and charged another.
 */

/** Rounds to 2 decimals, avoiding the float drift of `toFixed` chains. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Applies a discount percentage to a price.
 *
 * @param price The original price.
 * @param percentage The discount percentage, 0-100.
 */
export function discountedPrice(price: number, percentage: number): number {
  if (percentage <= 0) {
    return round2(price);
  }

  return round2(price * (1 - percentage / 100));
}

/**
 * Splits a subtotal into its pre-discount total and the discount amount.
 */
export function splitDiscount(
  subtotal: number,
  percentage: number,
): { subtotal: number; discountAmount: number; discountedTotal: number } {
  const subtotalAmount = round2(subtotal);

  if (percentage <= 0) {
    return {
      subtotal: subtotalAmount,
      discountAmount: 0,
      discountedTotal: subtotalAmount,
    };
  }

  const discountedTotal = round2(
    subtotalAmount * (1 - percentage / 100),
  );

  return {
    subtotal: subtotalAmount,
    // Derived from the rounded totals so the discount and the discounted
    // total always add back up to the subtotal exactly.
    discountAmount: round2(subtotalAmount - discountedTotal),
    discountedTotal,
  };
}
