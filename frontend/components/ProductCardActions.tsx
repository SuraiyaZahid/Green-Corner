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

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addToCart}
          disabled={busy || outOfStock}
          className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Adding…' : outOfStock ? 'Out of stock' : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={busy || outOfStock}
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

      <SignInPrompt
        open={promptOpen}
        onClose={closePrompt}
        redirectTo={redirectTo}
        product={{
          name: product.name,
          price: product.price,
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
