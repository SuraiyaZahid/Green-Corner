'use client';

import { InCartNote } from '@/components/InCartNote';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Toast } from '@/components/Toast';
import { useCartAction } from '@/lib/use-cart-action';
import type { Product } from '@/lib/types';

/**
 * Compact Add to Cart / Buy Now controls for a product card.
 *
 * These live outside the card's <Link>, so clicking a button never
 * navigates to the product page.
 */
export function ProductCardActions({ product }: { product: Product }) {
  const {
    busy,
    promptOpen,
    toast,
    redirectTo,
    inCartQuantity,
    remainingAvailable,
    atStockLimit,
    addToCart,
    buyNow,
    closePrompt,
    dismissToast,
  } = useCartAction({
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
    },
    redirectTo: `/products/${product.slug}`,
  });

  const outOfStock = product.stock <= 0;
  // The shopper already has every available unit of this product in their
  // cart, so there is nothing left to add from the listing.
  const fullyReserved = !outOfStock && atStockLimit;

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addToCart}
          disabled={busy || outOfStock || fullyReserved}
          className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? 'Adding…'
            : outOfStock
              ? 'Out of stock'
              : fullyReserved
                ? 'Max in cart'
                : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={busy || outOfStock || fullyReserved}
          className="flex-1 rounded-lg border border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>

      <InCartNote
        inCartQuantity={inCartQuantity}
        stock={product.stock}
        className="mt-2"
      />

      {fullyReserved && (
        <p className="mt-1 text-xs font-medium text-amber-600">
          Maximum available stock is already in your cart.
        </p>
      )}

      <SignInPrompt
        open={promptOpen}
        onClose={closePrompt}
        redirectTo={redirectTo}
        product={{
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          imageUrl: product.imageUrl,
        }}
      />

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={dismissToast}
      />
    </>
  );
}

export default ProductCardActions;
