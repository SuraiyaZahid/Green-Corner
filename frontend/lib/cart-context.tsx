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

interface GuestCartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  stock: number;
}

const GUEST_CART_KEY = 'gc_guest_cart';

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
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      setGuestItems(readGuestCart());
      setLoading(false);
      return;
    }

    try {
      const serverCart = await apiRequest<Cart>('/cart');
      setCart(serverCart);
      setGuestItems([]);
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
    async (productId: string, quantity: number) => {
      if (!user) {
        const existing = readGuestCart();
        const match = existing.find((item) => item.productId === productId);

        if (match) {
          const next = existing.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
          writeGuestCart(next);
          setGuestItems(next);
        } else {
          const product = await apiRequest<{ id: string; name: string; slug: string; price: number; stock: number; imageUrl: string | null }>(
            `/products/${productId}`,
            { auth: false },
          );
          const next = [
            ...existing,
            {
              productId,
              name: product.name,
              slug: product.slug,
              price: product.price,
              quantity,
              imageUrl: product.imageUrl,
              stock: product.stock,
            },
          ];
          writeGuestCart(next);
          setGuestItems(next);
        }
        return;
      }

      const updated = await apiRequest<Cart>('/cart/items', {
        method: 'POST',
        body: { productId, quantity },
      });
      setCart(updated);
    },
    [user],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user) {
        const next = readGuestCart().map((item) =>
          item.productId === itemId ? { ...item, quantity } : item,
        );
        writeGuestCart(next);
        setGuestItems(next);
        return;
      }

      const updated = await apiRequest<Cart>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: { quantity },
      });
      setCart(updated);
    },
    [user],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) {
        const next = readGuestCart().filter((item) => item.productId !== itemId);
        writeGuestCart(next);
        setGuestItems(next);
        return;
      }

      const updated = await apiRequest<Cart>(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      setCart(updated);
    },
    [user],
  );

  const clear = useCallback(async () => {
    if (!user) {
      writeGuestCart([]);
      setGuestItems([]);
      return;
    }

    const updated = await apiRequest<Cart>('/cart', { method: 'DELETE' });
    setCart(updated);
  }, [user]);

  const items = useMemo(() => {
    if (user && cart) {
      return cart.items;
    }

    return guestItems.map((item) => ({
      id: item.productId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: Number((item.price * item.quantity).toFixed(2)),
      product: {
        id: item.productId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: item.stock,
        imageUrl: item.imageUrl,
        images: [] as string[],
        isArchived: false,
        category: { id: '', name: '', slug: '' },
      },
    }));
  }, [user, cart, guestItems]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
      ),
      loading,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refresh,
    }),
    [cart, items, loading, addItem, updateQuantity, removeItem, clear, refresh],
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
