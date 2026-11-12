'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, formatBDT, formatDateTime } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/Badge';
import { EmptyState, Skeleton } from '@/components/EmptyState';
import type { Order } from '@/lib/types';

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Order[]>('/orders')
      .then(setOrders)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load orders.'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span>
        <Link href="/account">Account</Link> <span className="mx-1">/</span> Orders
      </nav>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        My Orders
      </h1>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No orders yet"
            message="When you place an order it will appear here with its delivery status."
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
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-gray-500">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
                    {order.paymentMethod === 'COD'
                      ? 'Cash on Delivery'
                      : order.paymentMethod === 'BKASH'
                        ? 'bKash'
                        : 'Nagad'}
                    {order.trxId ? ` · TrxID ${order.trxId}` : ''}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold text-emerald-800">
                    {formatBDT(order.totalAmount)}
                  </span>
                  <div className="flex gap-2">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}
