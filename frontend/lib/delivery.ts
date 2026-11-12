import type { DeliveryArea } from './types';

/**
 * Delivery fee per area, in Bangladeshi Taka.
 *
 * These mirror the server-side rates so the checkout can show a live total.
 * The server re-resolves the fee from the submitted delivery area — this
 * copy is for display only and is never sent to the API.
 */
export const DELIVERY_FEES: Record<DeliveryArea, number> = {
  INSIDE_DHAKA: 80,
  OUTSIDE_DHAKA: 120,
};

export const DELIVERY_AREA_OPTIONS: Array<{
  id: DeliveryArea;
  label: string;
  description: string;
}> = [
  {
    id: 'INSIDE_DHAKA',
    label: 'Inside Dhaka (ঢাকা সিটির ভেতরে)',
    description: 'Delivered within Dhaka city.',
  },
  {
    id: 'OUTSIDE_DHAKA',
    label: 'Outside Dhaka (ঢাকার বাইরে)',
    description: 'Delivered to any district outside Dhaka.',
  },
];

/** Resolves the delivery fee for an area. */
export function deliveryFeeFor(area: DeliveryArea): number {
  return DELIVERY_FEES[area];
}

/** Short, human-readable name for an area. */
export function deliveryAreaLabel(area: DeliveryArea | null | undefined): string {
  if (!area) return '—';
  return area === 'INSIDE_DHAKA'
    ? 'Inside Dhaka (ঢাকা সিটির ভেতরে)'
    : 'Outside Dhaka (ঢাকার বাইরে)';
}
