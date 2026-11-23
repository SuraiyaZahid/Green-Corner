'use client';

import { useEffect, useState } from 'react';
import { InCartNote } from '@/components/InCartNote';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Toast } from '@/components/Toast';
import { useCartAction } from '@/lib/use-cart-action';
import type { Product } from '@/lib/types';

/**
 * Compact Add to Cart / Buy Now controls for a product card.
 *
 * These render inside the card's <Link>, so every click has to stop the
 * card from navigating to the product page.
 */
export function ProductCardActions({ product }: { product: Product }) {
  const [justAdded, setJustAdded] = useState(false);

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

  // The card sits inside a <Link>, so the click must not reach it.
  const swallowClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // A short-lived "Added ✓" confirmation on the button itself, so the
  // shopper sees the result without waiting for the toast.
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const handleAddToCart = (event: React.MouseEvent) => {
    swallowClick(event);
    if (busy || outOfStock || fullyReserved) return;
    setJustAdded(true);
    void addToCart();
  };

  const handleBuyNow = (event: React.MouseEvent) => {
    swallowClick(event);
    if (busy || outOfStock || fullyReserved) return;
    void buyNow();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={busy || outOfStock || fullyReserved}
          aria-label={`Add ${product.name} to cart`}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-700 px-2 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
        >
          <span aria-hidden="true">🛒</span>
          {justAdded
            ? 'Added ✓'
            : busy
              ? 'Adding…'
              : outOfStock
                ? 'Out of Stock'
                : fullyReserved
                  ? 'Max in Cart'
                  : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={busy || outOfStock || fullyReserved}
          aria-label={`Buy ${product.name} now`}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {busy
            ? '…'
            : outOfStock
              ? 'Out of Stock'
              : fullyReserved
                ? 'Max in Cart'
                : 'Buy Now'}
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
