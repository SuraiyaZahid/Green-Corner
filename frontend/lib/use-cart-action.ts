'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

/** The action a visitor was trying to take when they were asked to sign in. */
export type CartAction = 'cart' | 'checkout';

export interface UseCartActionOptions {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    imageUrl: string | null;
  };
  quantity?: number;
  /** Where the visitor should land after signing in. */
  redirectTo: string;
}

/**
 * Shared guard behind every "Add to Cart" / "Buy Now" button.
 *
 * The click is intercepted before any protected API call: a signed-out
 * visitor gets the sign-in prompt instead of a bare "Product not found."
 * error, and once they sign in the interrupted action resumes automatically.
 *
 * The `authLoading` check must come first — `useAuth().user` is `null`
 * during the provider's hydration phase even for signed-in users, so
 * checking `!user` alone would nag people who are already signed in.
 */
export function useCartAction({
  product,
  quantity = 1,
  redirectTo,
}: UseCartActionOptions) {
  const { addItem, items } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // The action that was interrupted by the sign-in prompt, replayed once the
  // auth context reports a signed-in user.
  const pendingAction = useRef<CartAction | null>(null);
  const hasResumed = useRef(false);

  const openPrompt = useCallback((action: CartAction) => {
    pendingAction.current = action;
    setPromptOpen(true);
  }, []);

  const performAdd = useCallback(
    async (mode: 'add' | 'set') => {
      await addItem(product, quantity, mode);
    },
    [addItem, product, quantity],
  );

  const run = useCallback(
    async (action: CartAction) => {
      if (authLoading) return;

      if (!user) {
        openPrompt(action);
        return;
      }

      setBusy(true);
      try {
        // "Add to Cart" adds to the line the shopper already has, while
        // "Buy Now" replaces it. Replacing is what keeps Buy Now from
        // reserving the product twice and tripping the stock check.
        await performAdd(action === 'checkout' ? 'set' : 'add');
        pendingAction.current = null;

        if (action === 'checkout') {
          router.push('/checkout');
          return;
        }

        setToast({
          message:
            quantity > 1 ? `Added ${quantity} to cart!` : 'Added to cart!',
          type: 'success',
        });
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
    [authLoading, user, performAdd, openPrompt, router, quantity],
  );

  // Resume the interrupted action once the visitor completes the sign-in.
  useEffect(() => {
    if (authLoading || !user || hasResumed.current) return;

    const action = pendingAction.current;
    if (!action) return;

    hasResumed.current = true;
    pendingAction.current = null;
    void run(action);
  }, [authLoading, user, run]);

  const closePrompt = useCallback(() => {
    setPromptOpen(false);
    pendingAction.current = null;
  }, []);

  // How many of this product the visitor already has in the cart. The
  // backend sets the line quantity rather than incrementing it, so this
  // has to be read back from the cart instead of tracked locally.
  const inCartQuantity = useMemo(
    () =>
      items.reduce(
        (sum, item) => (item.productId === product.id ? sum + item.quantity : sum),
        0,
      ),
    [items, product.id],
  );

  // How many more units of this product the visitor may still add. The
  // stock shown on the product is the total stock, so the units already
  // sitting in the cart have to be subtracted — otherwise the stepper
  // would happily offer more than the store can fulfil.
  const remainingAvailable = Math.max(0, product.stock - inCartQuantity);

  // The stepper may not offer more than what is actually available, and
  // never more than the backend accepts in one request.
  const maxAddable = Math.min(99, remainingAvailable);

  // Everything the shopper could still put in the cart has already been
  // reserved by their own cart line.
  const atStockLimit = remainingAvailable === 0;

  return {
    busy,
    promptOpen,
    toast,
    redirectTo,
    inCartQuantity,
    remainingAvailable,
    maxAddable,
    atStockLimit,
    addToCart: () => run('cart'),
    buyNow: () => run('checkout'),
    closePrompt,
    dismissToast: () => setToast(null),
  };
}
