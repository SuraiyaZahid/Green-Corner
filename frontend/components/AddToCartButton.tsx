'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Toast } from '@/components/Toast';

export function AddToCartButton({
  productId,
  stock,
  price,
}: {
  productId: string;
  stock: number;
  price: number;
}) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

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

  const handleAdd = async () => {
    setBusy(true);
    try {
      await addItem(productId, quantity);
      setToast({ message: 'Added to your cart.', type: 'success' });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : 'Could not add to cart.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        onChange={setQuantity}
        max={Math.min(99, stock)}
        disabled={busy}
      />

      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Add to Cart'}
      </button>

      <button
        type="button"
        onClick={async () => {
          await handleAdd();
          router.push(user ? '/checkout' : '/cart');
        }}
        disabled={busy}
        className="rounded-lg border border-emerald-700 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Buy Now
      </button>

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default AddToCartButton;
