'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiRequest, buildQuery, formatBDT, formatDateTime } from '@/lib/api';
import { deliveryAreaLabel } from '@/lib/delivery';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminNav } from '@/components/AdminNav';
import { Modal } from '@/components/Modal';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/Badge';
import { DiscountBadge } from '@/components/DiscountBadge';
import { Toast } from '@/components/Toast';
import { Skeleton } from '@/components/EmptyState';
import type {
  AdminOrder,
  OrderListResponse,
  OrderStatus,
  PaymentStatus,
} from '@/lib/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'PROCESSING',
  'DELIVERED',
  'CANCELLED',
];

const PAYMENT_OPTIONS: PaymentStatus[] = [
  'UNPAID',
  'VERIFYING',
  'PAID',
  'FAILED',
];

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(
    (searchParams.get('status') as OrderStatus) ?? '',
  );
  const [paymentStatus, setPaymentStatus] = useState(
    (searchParams.get('paymentStatus') as PaymentStatus) ?? '',
  );
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  // The item subtotal is derived from the line items so the breakdown always
  // matches what was actually ordered.
  const selectedSubtotal = Number(
    (selected?.items ?? []).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ).toFixed(2),
  );

  const load = async () => {
    setLoading(true);
    try {
      const query = buildQuery({
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        search: search || undefined,
        limit: 50,
      });
      const data = await apiRequest<OrderListResponse>(`/admin/orders${query}`);
      setOrders(data.items);
      setTotal(data.total);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not load orders.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentStatus, search]);

  const updateStatus = async (order: AdminOrder, nextStatus: OrderStatus) => {
    try {
      const updated = await apiRequest<AdminOrder>(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      setToast({ message: `Order marked as ${nextStatus}.`, type: 'success' });
      setSelected(updated);
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Could not update status.',
        type: 'error',
      });
    }
  };

  const updatePayment = async (
    order: AdminOrder,
    nextStatus: PaymentStatus,
  ) => {
    try {
      const updated = await apiRequest<AdminOrder>(`/admin/orders/${order.id}/payment`, {
        method: 'PATCH',
        body: { paymentStatus: nextStatus },
      });
      setToast({
        message: `Payment marked as ${nextStatus}.`,
        type: 'success',
      });
      setSelected(updated);
      await load();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : 'Could not update payment.',
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Orders &amp; Verification
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} order{total === 1 ? '' : 's'} match the current filters.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search TrxID, phone, email or order id…"
          className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:min-w-72"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(event) =>
            setPaymentStatus(event.target.value as PaymentStatus)
          }
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All payments</option>
          {PAYMENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">TrxID</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-medium text-gray-800">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{order.user.name}</p>
                    <p className="text-xs text-gray-400">{order.user.phone ?? order.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-700">
                      {order.paymentMethod === 'COD'
                        ? 'Cash on Delivery'
                        : order.paymentMethod === 'BKASH'
                          ? 'bKash'
                          : 'Nagad'}
                    </p>
                    <div className="mt-1">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {order.trxId ? (
                      <>
                        <p className="font-mono text-xs text-gray-800">{order.trxId}</p>
                        <p className="mt-0.5 font-mono text-xs text-gray-400">
                          {order.senderNumber}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {formatBDT(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(order)}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No orders match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / verification modal */}
      <Modal
        open={Boolean(selected)}
        title={
          selected ? `Order #${selected.id.slice(0, 8).toUpperCase()}` : 'Order'
        }
        onClose={() => setSelected(null)}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={selected.status} />
              <PaymentStatusBadge status={selected.paymentStatus} />
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {selected.paymentMethod}
              </span>
            </div>

            {/* TrxID verification panel */}
            {selected.paymentMethod !== 'COD' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="font-semibold text-amber-900">
                  Payment verification
                </h3>
                <p className="mt-1 text-xs text-amber-800">
                  Check the details below against the merchant account
                  (bKash / Nagad number 01735262232), then confirm the payment.
                </p>

                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-amber-800">TrxID</dt>
                    <dd className="font-mono font-semibold text-amber-950">
                      {selected.trxId ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-amber-800">Sender number</dt>
                    <dd className="font-mono font-semibold text-amber-950">
                      {selected.senderNumber ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-amber-800">Amount due</dt>
                    <dd className="font-semibold text-amber-950">
                      {formatBDT(selected.totalAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-amber-800">Delivery area</dt>
                    <dd className="font-semibold text-amber-950">
                      {deliveryAreaLabel(selected.deliveryArea)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updatePayment(selected, 'PAID')}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    Mark as Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePayment(selected, 'VERIFYING')}
                    className="rounded-lg border border-amber-400 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    Still verifying
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePayment(selected, 'FAILED')}
                    className="rounded-lg border border-red-400 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Mark as Failed
                  </button>
                </div>
              </div>
            )}

            {/* Customer */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Customer</h3>
              <dl className="mt-2 space-y-1 text-sm text-gray-600">
                <div>
                  <dt className="inline text-gray-400">Name: </dt>
                  <dd className="inline">{selected.user.name}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-400">Email: </dt>
                  <dd className="inline">{selected.user.email}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-400">Phone: </dt>
                  <dd className="inline">{selected.user.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-400">Address: </dt>
                  <dd className="inline">{selected.shippingAddr}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-400">Delivery area: </dt>
                  <dd className="inline">
                    {deliveryAreaLabel(selected.deliveryArea)}
                  </dd>
                </div>
                {selected.note && (
                  <div>
                    <dt className="inline text-gray-400">Note: </dt>
                    <dd className="inline">{selected.note}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Items ({selected.items.length})
              </h3>
              <ul className="mt-2 divide-y divide-gray-100 text-sm">
                {selected.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <span className="text-gray-700">
                      {item.productName}{' '}
                      <span className="text-xs text-gray-400">
                        × {item.quantity}
                      </span>
                    </span>
                    <span className="font-medium text-gray-800">
                      {formatBDT(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">
                    {formatBDT(
                      selected.discountPercentage > 0
                        ? selected.subtotalAmount
                        : selectedSubtotal,
                    )}
                  </span>
                </div>
                {selected.discountPercentage > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      Discount
                      <DiscountBadge percentage={selected.discountPercentage} />
                    </span>
                    <span className="font-medium text-red-600">
                      −{formatBDT(selected.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Delivery
                    <span className="ml-1 text-xs text-gray-400">
                      ({deliveryAreaLabel(selected.deliveryArea)})
                    </span>
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatBDT(selected.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-emerald-800">
                    {formatBDT(selected.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status control */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Fulfilment status
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Cancelling restores the reserved stock. Delivering marks the
                payment as paid.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={selected.status === option}
                    onClick={() => updateStatus(selected, option)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                      selected.status === option
                        ? 'cursor-default bg-emerald-700 text-white'
                        : 'border border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <RequireAuth adminOnly>
      <OrdersContent />
    </RequireAuth>
  );
}
