import Image from 'next/image';
import Link from 'next/link';
import { ProductCardActions } from '@/components/ProductCardActions';
import { DiscountBadge } from '@/components/DiscountBadge';
import { DiscountedPrice } from '@/components/DiscountedPrice';
import type { Product } from '@/lib/types';

export function ProductCard({
  product,
  showActions = false,
}: {
  product: Product;
  /** Show the Add to Cart / Buy Now buttons under the card. */
  showActions?: boolean;
}) {
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card">
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-square overflow-hidden bg-emerald-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              🌿
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <DiscountBadge percentage={product.discountPercentage} />
            {product.isFeatured && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                Featured
              </span>
            )}
            {!inStock && (
              <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-white">
                Out of stock
              </span>
            )}
            {lowStock && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            {product.category.name}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800 group-hover:text-emerald-800">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {product.description}
          </p>
          <div className="mt-auto pt-3">
            <DiscountedPrice
              price={product.price}
              discountedPrice={product.discountedPrice}
              discountPercentage={product.discountPercentage}
            />
          </div>
        </div>
      </Link>

      {showActions && (
        <div className="border-t border-gray-100 p-3 pt-0">
          <ProductCardActions product={product} />
        </div>
      )}
    </div>
  );
}

export default ProductCard;
