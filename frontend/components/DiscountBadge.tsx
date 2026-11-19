import { discountLabel, hasDiscount } from '@/lib/discount';

/**
 * The red "15% OFF" badge shown on discounted products.
 *
 * Renders nothing when there is no store-wide discount in force.
 */
export function DiscountBadge({
  percentage,
  className = '',
}: {
  percentage: number;
  className?: string;
}) {
  if (!hasDiscount(percentage)) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm ${className}`}
    >
      {discountLabel(percentage)}
    </span>
  );
}

export default DiscountBadge;
