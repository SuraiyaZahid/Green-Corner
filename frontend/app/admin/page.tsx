'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, formatBDT, formatDateTime } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/Badge';
import { Skeleton } from '@/components/EmptyState';
import type { AdminOrder, AdminStats } from '@/lib/types';

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<AdminStats>('/admin/orders/stats')
      .then(setStats)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load stats.'),
      )
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'Total orders', value: stats.totalOrders, href: '/admin/orders' },
        { label: 'Pending', value: stats.pendingOrders, href: '/admin/orders?status=PENDING' },
        { label: 'Processing', value: stats.processingOrders, href: '/admin/orders?status=PROCESSING' },
        { label: 'Delivered', value: stats.deliveredOrders, href: '/admin/orders?status=DELIVERED' },
        {
          label: 'Awaiting payment check',
          value: stats.pendingVerification,
          href: '/admin/orders?paymentStatus=VERIFYING',
          highlight: stats.pendingVerification > 0,
        },
        { label: 'Cancelled', value: stats.cancelledOrders, href: '/admin/orders?status=CANCELLED' },
        { label: 'Live products', value: stats.productCount, href: '/admin/products' },
        {
          label: 'Low stock (≤5)',
          value: stats.lowStockCount,
          href: '/admin/products',
          highlight: stats.lowStockCount > 0,
        },
      ]
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span> Admin
      </nav>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        Admin Dashboard
      </h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card ${
                  card.highlight
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-gray-200'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {card.value}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800">Recent orders</h2>

              {stats?.recentOrders.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                        <th className="pb-2 font-semibold">Order</th>
                        <th className="pb-2 font-semibold">Customer</th>
                        <th className="pb-2 font-semibold">Total</th>
                        <th className="pb-2 font-semibold">Status</th>
                        <th className="pb-2 font-semibold">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-2.5">
                            <Link
                              href={`/admin/orders?search=${order.id.slice(0, 8)}`}
                              className="font-mono text-xs text-emerald-700 hover:underline"
                            >
                              #{order.id.slice(0, 8).toUpperCase()}
                            </Link>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </td>
                          <td className="py-2.5">
                            <p className="text-gray-800">{order.user.name}</p>
                            <p className="text-xs text-gray-400">
                              {order.user.email}
                            </p>
                          </td>
                          <td className="py-2.5 font-semibold text-gray-800">
                            {formatBDT(order.totalAmount)}
                          </td>
                          <td className="py-2.5">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="py-2.5">
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No orders yet.</p>
              )}
            </section>

            <div className="space-y-4">
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-800">Revenue</h2>
                <p className="mt-2 text-3xl font-bold text-emerald-800">
                  {formatBDT(stats?.revenue ?? 0)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Total value of all non-cancelled orders.
                </p>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-800">Quick actions</h2>
                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Manage products', href: '/admin/products' },
                    { label: 'Manage categories', href: '/admin/categories' },
                    { label: 'Orders & verification', href: '/admin/orders' },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="block rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {action.label} →
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminDashboard />
    </RequireAuth>
  );
}
