import { DeliveryArea } from '@prisma/client';

/**
 * Delivery fee per area, in Bangladeshi Taka.
 *
 * These are the single source of truth for pricing — the client only ever
 * sends the chosen `DeliveryArea`, never the fee itself. The server resolves
 * the amount so a tampered request cannot change what the customer is charged.
 */
export const DELIVERY_FEES: Record<DeliveryArea, number> = {
  [DeliveryArea.INSIDE_DHAKA]: 80,
  [DeliveryArea.OUTSIDE_DHAKA]: 120,
};

/** Human-readable labels, used by the API when describing an order. */
export const DELIVERY_AREA_LABELS: Record<DeliveryArea, string> = {
  [DeliveryArea.INSIDE_DHAKA]: 'Inside Dhaka (ঢাকা সিটির ভেতরে)',
  [DeliveryArea.OUTSIDE_DHAKA]: 'Outside Dhaka (ঢাকার বাইরে)',
};

/** Resolves the delivery fee for an area. */
export function deliveryFeeFor(area: DeliveryArea): number {
  return DELIVERY_FEES[area];
}
