'use client';

import { useState } from 'react';
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
}: {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  price: number;
}) {
  const [quantity, setQuantity] = useState(1);

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
    product: { id: productId, name, slug, price, stock, imageUrl },
    quantity,
    redirectTo: `/products/${slug}`,
  });

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

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={Math.min(99, stock)}
          disabled={busy}
        />

        <button
          type="button"
          onClick={addToCart}
          disabled={busy}
          className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Adding…' : 'Add to Cart'}
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={busy}
          className="rounded-lg border border-emerald-700 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buy Now
        </button>
      </div>

      <InCartNote
        inCartQuantity={inCartQuantity}
        stock={stock}
        selected={quantity}
        className="mt-2"
      />

      <SignInPrompt
        open={promptOpen}
        onClose={closePrompt}
        redirectTo={redirectTo}
        product={{ name, price, imageUrl }}
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
