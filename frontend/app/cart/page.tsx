'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { formatBDT } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { loginUrlFor } from '@/lib/redirect';
import { QuantityStepper } from '@/components/QuantityStepper';
import { EmptyState } from '@/components/EmptyState';
import { Toast } from '@/components/Toast';

export default function CartPage() {
  const { items, subtotal, totalItems, updateQuantity, removeItem, clear, loading } =
    useCart();
  const { user } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const handleUpdate = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Update failed.',
        type: 'error',
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
      setToast({ message: 'Item removed from your cart.', type: 'success' });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not remove item.',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        Your Cart
        {totalItems > 0 && (
          <span className="ml-2 text-base font-normal text-gray-500">
            ({totalItems} item{totalItems === 1 ? '' : 's'})
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Your cart is empty"
            message="Browse our collection of plants, compost, tools, seeds and pots to get started."
            action={
              <Link
                href="/products"
                className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Start shopping
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Line items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <Link
                  href={`/products/${item.product.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-emerald-50"
                >
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      🌿
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold text-gray-800 hover:text-emerald-800"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.product.category.name} · {formatBDT(item.unitPrice)} each
                    </p>
                    {item.product.stock <= 5 && item.product.stock > 0 && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        Only {item.product.stock} left in stock
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(quantity) => handleUpdate(item.id, quantity)}
                      max={Math.min(99, item.product.stock)}
                    />

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-800">
                        {formatBDT(item.lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => clear()}
              className="text-xs font-medium text-gray-500 hover:text-red-600 hover:underline"
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-semibold text-gray-800">Order Summary</h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-medium text-gray-800">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Delivery</dt>
                <dd className="font-medium text-gray-800">
                  Calculated at checkout
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-emerald-800">
                {formatBDT(subtotal)}
              </span>
            </div>

            {user ? (
              <Link
                href="/checkout"
                className="mt-5 block rounded-lg bg-emerald-700 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                Proceed to Checkout
              </Link>
            ) : (
              <>
                <Link
                  href={loginUrlFor('/checkout')}
                  className="mt-5 block rounded-lg bg-emerald-700 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Sign in to Checkout
                </Link>
                <p className="mt-2 text-center text-xs text-gray-500">
                  Please sign in to add items to your cart or place an order.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
