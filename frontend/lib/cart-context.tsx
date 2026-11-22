'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiRequest } from './api';
import { useAuth } from './auth-context';
import type { Cart } from './types';

/** The minimum a caller must supply so the cart can be updated. */
export interface AddToCartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageUrl: string | null;
}

interface CartContextValue {
  cart: Cart | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discountedUnitPrice: number;
    lineTotal: number;
    /** When the line stops holding its stock and is auto-released. */
    expiresAt: string;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      discountedPrice: number;
      discountPercentage: number;
      stock: number;
      imageUrl: string | null;
      images: string[];
      isArchived: boolean;
      category: { id: string; name: string; slug: string };
    };
  }>;
  totalItems: number;
  /** The item total before the store-wide discount. */
  subtotal: number;
  /** The discount applied to the subtotal. */
  discountAmount: number;
  /** The store-wide discount percentage in force. */
  discountPercentage: number;
  /** The total the customer actually pays for the items. */
  total: number;
  /** How long a cart line holds its stock, in minutes. */
  holdMinutes: number;
  loading: boolean;
  /** Item ids whose quantity is currently being written to the server. */
  pendingItems: string[];
  addItem: (
    product: AddToCartProduct,
    quantity: number,
    mode?: 'add' | 'set',
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      const serverCart = await apiRequest<Cart>('/cart');
      setCart(serverCart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const addItem = useCallback(
    async (
      product: AddToCartProduct,
      quantity: number,
      mode: 'add' | 'set' = 'add',
    ) => {
      // Update locally first so the "X in cart" badge and the header cart
      // count move the instant the shopper clicks, then reconcile with the
      // server response. A failed write restores the previous state.
      setCart((current) => {
        if (!current) return current;

        const existing = current.items.find(
          (item) => item.productId === product.id,
        );

        // "add" grows the existing line, "set" replaces it.
        const nextQuantity = mode === 'set' ? quantity : (existing?.quantity ?? 0) + quantity;

        const items = existing
          ? current.items.map((item) =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: nextQuantity,
                    lineTotal: Number(
                      (item.discountedUnitPrice * nextQuantity).toFixed(2),
                    ),
                  }
                : item,
            )
          : [
              ...current.items,
              {
                id: `optimistic-${product.id}`,
                productId: product.id,
                quantity: nextQuantity,
                unitPrice: product.price,
                discountedUnitPrice: product.price,
                lineTotal: Number((product.price * nextQuantity).toFixed(2)),
                expiresAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
                product: {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  description: '',
                  careInstructions: null,
                  price: product.price,
                  discountedPrice: product.price,
                  discountPercentage: current.discountPercentage,
                  stock: product.stock,
                  imageUrl: product.imageUrl,
                  images: [],
                  isFeatured: false,
                  isArchived: false,
                  categoryId: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  category: {
                    id: '',
                    name: '',
                    slug: '',
                  },
                },
              },
            ];

        return {
          ...current,
          items,
          totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: Number(
            items
              .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
              .toFixed(2),
          ),
          total: Number(
            items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
          ),
        };
      });

      try {
        const updated = await apiRequest<Cart>('/cart/items', {
          method: 'POST',
          body: { productId: product.id, quantity, mode },
        });
        setCart(updated);
      } catch (error) {
        // Re-read the cart from the server, which is the authoritative
        // state — a plain rollback could clobber a change another tab or
        // the expiry sweep made in the meantime.
        try {
          const current = await apiRequest<Cart>('/cart');
          setCart(current);
        } catch {
          // The cart could not be re-read either; the next refresh will
          // reconcile it.
        }
        throw error;
      }
    },
    [],
  );

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    // Update locally first so the stepper, the line total and the header
    // badge move the instant the shopper clicks, then reconcile with the
    // server response. A failed write restores the previous quantity.
    setPendingItems((current) => [...current, itemId]);

    // Read the current quantity outside the state updater so the rollback
    // does not depend on when React runs the updater.
    const previousQuantity =
      cart?.items.find((item) => item.id === itemId)?.quantity ?? 0;

    setCart((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                // The line total is based on the discounted unit price, so the
                // optimistic total matches what the server will return.
                lineTotal: Number(
                  (item.discountedUnitPrice * quantity).toFixed(2),
                ),
              }
            : item,
        ),
      };
    });

    try {
      const updated = await apiRequest<Cart>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: { quantity },
      });
      setCart(updated);
    } catch (error) {
      // Roll the line back to what it was before this write.
      setCart((current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: previousQuantity,
                  lineTotal: Number(
                    (item.discountedUnitPrice * previousQuantity).toFixed(2),
                  ),
                }
              : item,
          ),
        };
      });
      throw error;
    } finally {
      setPendingItems((current) => current.filter((id) => id !== itemId));
    }
  }, [cart]);

  const removeItem = useCallback(async (itemId: string) => {
    const updated = await apiRequest<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    setCart(updated);
  }, []);

  const clear = useCallback(async () => {
    const updated = await apiRequest<Cart>('/cart', { method: 'DELETE' });
    setCart(updated);
  }, []);

  const items = useMemo(() => cart?.items ?? [], [cart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      // The subtotal is the pre-discount total, so the summary can show what
      // the shopper would have paid without the store discount.
      subtotal: Number(
        items
          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
          .toFixed(2),
      ),
      discountAmount: cart?.discountAmount ?? 0,
      discountPercentage: cart?.discountPercentage ?? 0,
      // The total is the sum of the discounted line totals, which the server
      // computes from the same percentage it will charge.
      total: Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
      ),
      holdMinutes: cart?.holdMinutes ?? 3,
      loading,
      pendingItems,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refresh,
    }),
    [cart, items, loading, pendingItems, addItem, updateQuantity, removeItem, clear, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider.');
  }
  return context;
}
