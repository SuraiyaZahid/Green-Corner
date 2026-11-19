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
    lineTotal: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      stock: number;
      imageUrl: string | null;
      images: string[];
      isArchived: boolean;
      category: { id: string; name: string; slug: string };
    };
  }>;
  totalItems: number;
  subtotal: number;
  loading: boolean;
  /** Item ids whose quantity is currently being written to the server. */
  pendingItems: string[];
  addItem: (product: AddToCartProduct, quantity: number) => Promise<void>;
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
    async (product: AddToCartProduct, quantity: number) => {
      const updated = await apiRequest<Cart>('/cart/items', {
        method: 'POST',
        body: { productId: product.id, quantity },
      });
      setCart(updated);
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
                lineTotal: Number((item.unitPrice * quantity).toFixed(2)),
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
                  lineTotal: Number((item.unitPrice * previousQuantity).toFixed(2)),
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
      subtotal: Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
      ),
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
