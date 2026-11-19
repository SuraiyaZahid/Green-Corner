import { formatBDT } from '@/lib/api';
import { hasDiscount } from '@/lib/discount';

/**
 * A price with the original amount struck through next to the discounted one.
 *
 * When there is no store-wide discount the plain price is rendered on its own.
 */
export function DiscountedPrice({
  price,
  discountedPrice,
  discountPercentage,
  className = '',
  size = 'md',
}: {
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const discounted = hasDiscount(discountPercentage);

  const priceSize =
    size === 'lg'
      ? 'text-2xl'
      : size === 'sm'
        ? 'text-sm'
        : 'text-base';

  if (!discounted) {
    return (
      <span className={`font-bold text-emerald-800 ${priceSize} ${className}`}>
        {formatBDT(price)}
      </span>
    );
  }

  return (
    <span className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-bold text-emerald-800 ${priceSize}`}>
        {formatBDT(discountedPrice)}
      </span>
      <span
        className={`text-gray-400 line-through ${
          size === 'lg' ? 'text-base' : 'text-xs'
        }`}
      >
        {formatBDT(price)}
      </span>
    </span>
  );
}

export default DiscountedPrice;
