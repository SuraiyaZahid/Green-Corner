'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiRequest, formatBDT, formatDateTime } from '@/lib/api';
import { deliveryAreaLabel } from '@/lib/delivery';
import { RequireAuth } from '@/components/RequireAuth';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/Badge';
import { DiscountBadge } from '@/components/DiscountBadge';
import { OrderTimeline } from '@/components/OrderTimeline';
import { Skeleton } from '@/components/EmptyState';
import { Toast } from '@/components/Toast';
import type { Order, TrackResponse } from '@/lib/types';

function OrderDetailContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [track, setTrack] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get('placed') === '1';

  // The item subtotal is derived from the line items so the breakdown always
  // matches what was actually ordered. The line prices are the discounted
  // ones, so this is the amount after the store-wide discount.
  const itemSubtotal = Number(
    (order?.items ?? []).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ).toFixed(2),
  );

  const load = async () => {
    try {
      const [orderData, trackData] = await Promise.all([
        apiRequest<Order>(`/orders/${orderId}`),
        apiRequest<TrackResponse>(`/orders/${orderId}/track`),
      ]);
      setOrder(orderData);
      setTrack(trackData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;

    setBusy(true);
    try {
      await apiRequest<Order>(`/orders/${orderId}/cancel`, { method: 'POST' });
      await load();
      setToast({ message: 'Order cancelled.', type: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Could not cancel the order.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Order not found.'}
        </div>
        <Link
          href="/account/orders"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back to my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span>{' '}
        <Link href="/account/orders">My Orders</Link>{' '}
        <span className="mx-1">/</span> Order
      </nav>

      {justPlaced && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          🎉 Thank you! Your order has been placed. We will call you to confirm
          before dispatch.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Items */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800">
              Items ({order.items.length})
            </h2>

            <ul className="mt-4 divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-sm font-medium text-gray-800 hover:text-emerald-800"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.quantity} × {formatBDT(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-medium text-gray-800">
                  {formatBDT(
                    order.discountPercentage > 0
                      ? order.subtotalAmount
                      : itemSubtotal,
                  )}
                </span>
              </div>
              {order.discountPercentage > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    Discount
                    <DiscountBadge percentage={order.discountPercentage} />
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    −{formatBDT(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  Delivery
                  <span className="ml-1 text-xs text-gray-400">
                    ({deliveryAreaLabel(order.deliveryArea)})
                  </span>
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {formatBDT(order.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-xl font-bold text-emerald-800">
                  {formatBDT(order.totalAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800">Delivery details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Shipping address
                </dt>
                <dd className="mt-1 text-gray-700">{order.shippingAddr}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Delivery area
                </dt>
                <dd className="mt-1 text-gray-700">
                  {deliveryAreaLabel(order.deliveryArea)}
                </dd>
              </div>
              {order.note && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">
                    Note
                  </dt>
                  <dd className="mt-1 text-gray-700">{order.note}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Payment method
                </dt>
                <dd className="mt-1 text-gray-700">
                  {order.paymentMethod === 'COD'
                    ? 'Cash on Delivery'
                    : order.paymentMethod === 'BKASH'
                      ? 'bKash'
                      : 'Nagad'}
                  {order.trxId ? (
                    <>
                      {' '}
                      · TrxID <span className="font-mono">{order.trxId}</span>
                    </>
                  ) : null}
                  {order.senderNumber ? (
                    <>
                      {' '}
                      · <span className="font-mono">{order.senderNumber}</span>
                    </>
                  ) : null}
                </dd>
              </div>
            </dl>
          </section>

          {order.status === 'PENDING' && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              {busy ? 'Cancelling…' : 'Cancel this order'}
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-semibold text-gray-800">Delivery status</h2>
          <div className="mt-4">
            {track ? (
              <OrderTimeline steps={track.steps} cancelled={track.cancelled} />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </div>

          <p className="mt-5 border-t border-gray-200 pt-4 text-xs text-gray-500">
            Questions about this order? Call{' '}
            <a href="tel:01735262232" className="font-medium hover:underline">
              01735262232
            </a>
          </p>
        </div>
      </div>

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireAuth>
      <Suspense fallback={<div className="container mx-auto px-4 py-8" />}>
        <OrderDetailContent orderId={params.id} />
      </Suspense>
    </RequireAuth>
  );
}
