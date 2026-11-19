'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { QuantityStepper } from '@/components/QuantityStepper';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Toast } from '@/components/Toast';

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
  const { addItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  // The action that was interrupted by the sign-in prompt, replayed once the
  // auth context reports a signed-in user.
  const pendingAction = useRef<'cart' | 'checkout' | null>(null);
  const hasResumed = useRef(false);

  const currentPath = `/products/${slug}`;

  const openPrompt = useCallback((action: 'cart' | 'checkout') => {
    pendingAction.current = action;
    setPromptOpen(true);
  }, []);

  const performAdd = useCallback(async () => {
    await addItem(
      { id: productId, name, slug, price, stock, imageUrl },
      quantity,
    );
  }, [addItem, productId, name, slug, price, stock, imageUrl, quantity]);

  const handleAdd = useCallback(
    async (action: 'cart' | 'checkout' = 'cart') => {
      // The auth context hydrates from localStorage, so `user` is null even for
      // a signed-in visitor until the first effect runs. Waiting for it avoids
      // showing the sign-in prompt to someone who is already signed in.
      if (authLoading) return;

      if (!user) {
        openPrompt(action);
        return;
      }

      setBusy(true);
      try {
        await performAdd();
        pendingAction.current = null;

        if (action === 'checkout') {
          router.push('/checkout');
          return;
        }

        setToast({ message: 'Added to your cart.', type: 'success' });
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          openPrompt(action);
          return;
        }

        setToast({
          message:
            error instanceof Error ? error.message : 'Could not add to cart.',
          type: 'error',
        });
      } finally {
        setBusy(false);
      }
    },
    [authLoading, user, performAdd, openPrompt, router],
  );

  // Resume the interrupted action once the visitor completes the sign-in.
  useEffect(() => {
    if (authLoading || !user || hasResumed.current) return;

    const action = pendingAction.current;
    if (!action) return;

    hasResumed.current = true;
    pendingAction.current = null;
    void handleAdd(action);
  }, [authLoading, user, handleAdd]);

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
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        onChange={setQuantity}
        max={Math.min(99, stock)}
        disabled={busy}
      />

      <button
        type="button"
        onClick={() => void handleAdd('cart')}
        disabled={busy}
        className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Add to Cart'}
      </button>

      <button
        type="button"
        onClick={() => void handleAdd('checkout')}
        disabled={busy}
        className="rounded-lg border border-emerald-700 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Buy Now
      </button>

      <SignInPrompt
        open={promptOpen}
        onClose={() => {
          setPromptOpen(false);
          pendingAction.current = null;
        }}
        redirectTo={currentPath}
        product={{ name, price, imageUrl }}
      />

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default AddToCartButton;
