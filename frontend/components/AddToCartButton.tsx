'use client';

import { useEffect, useState } from 'react';
import { InCartNote } from '@/components/InCartNote';
import { QuantityStepper } from '@/components/QuantityStepper';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Toast } from '@/components/Toast';
import { useCartAction } from '@/lib/use-cart-action';

export function AddToCartButton({
  productId,
  slug,
  name,
  imageUrl,
  stock,
  price,
  discountedPrice,
}: {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  price: number;
  /** The price after the store-wide discount, when one is active. */
  discountedPrice?: number;
}) {
  const [quantity, setQuantity] = useState(1);

  const {
    busy,
    promptOpen,
    toast,
    redirectTo,
    inCartQuantity,
    remainingAvailable,
    maxAddable,
    atStockLimit,
    addToCart,
    buyNow,
    closePrompt,
    dismissToast,
  } = useCartAction({
    product: { id: productId, name, slug, price, stock, imageUrl },
    quantity,
    redirectTo: `/products/${slug}`,
  });

  // The stepper can never offer more than the store can fulfil, so the
  // selected quantity is clamped down when the cart fills up the stock.
  useEffect(() => {
    if (maxAddable >= 1 && quantity > maxAddable) {
      setQuantity(maxAddable);
    }
  }, [maxAddable, quantity]);

  if (stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg bg-gray-300 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed sm:w-auto"
      >
        Out of stock
      </button>
    );
  }

  // Everything that is left is already reserved by this shopper's own cart
  // line, so there is nothing left to add.
  const soldOutForThisCart = atStockLimit;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={Math.max(1, maxAddable)}
          disabled={busy || soldOutForThisCart}
        />

        <button
          type="button"
          onClick={addToCart}
          disabled={busy || soldOutForThisCart}
          className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Adding…' : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={busy || soldOutForThisCart}
          className="rounded-lg border border-emerald-700 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buy Now
        </button>
      </div>

      {soldOutForThisCart ? (
        <p
          className="mt-2 text-xs font-medium text-amber-600"
          data-testid="stock-limit-note"
        >
          Maximum available stock is already in your cart.
        </p>
      ) : (
        <InCartNote
          inCartQuantity={inCartQuantity}
          stock={stock}
          selected={quantity}
          className="mt-2"
        />
      )}

      <SignInPrompt
        open={promptOpen}
        onClose={closePrompt}
        redirectTo={redirectTo}
        product={{ name, price, discountedPrice, imageUrl }}
      />

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={dismissToast}
      />
    </div>
  );
}

export default AddToCartButton;
