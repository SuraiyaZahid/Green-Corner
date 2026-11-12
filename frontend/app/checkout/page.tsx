'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest, formatBDT } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { deliveryFeeFor } from '@/lib/delivery';
import { DeliveryAreaPicker } from '@/components/DeliveryAreaPicker';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { EmptyState } from '@/components/EmptyState';
import type {
  DeliveryArea,
  MerchantDetails,
  Order,
  PaymentMethod,
} from '@/lib/types';

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, clear } = useCart();
  const router = useRouter();

  const [merchant, setMerchant] = useState<MerchantDetails | null>(null);
  const [shippingAddr, setShippingAddr] = useState('');
  const [note, setNote] = useState('');
  const [deliveryArea, setDeliveryArea] =
    useState<DeliveryArea>('INSIDE_DHAKA');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const deliveryFee = deliveryFeeFor(deliveryArea);
  const total = Number((subtotal + deliveryFee).toFixed(2));

  useEffect(() => {
    apiRequest<MerchantDetails>('/payment/merchant-details', { auth: false })
      .then(setMerchant)
      .catch(() => setMerchant(null));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.phone && !senderNumber) {
      setSenderNumber(user.phone);
    }
  }, [user, senderNumber]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (shippingAddr.trim().length < 10) {
      setError('Please enter a complete shipping address.');
      return;
    }

    if (paymentMethod !== 'COD') {
      if (!senderNumber.trim()) {
        setError('Your mobile number is required for mobile payments.');
        return;
      }
      if (!trxId.trim()) {
        setError('The transaction ID (TrxID) is required for mobile payments.');
        return;
      }
    }

    setBusy(true);
    try {
      const order = await apiRequest<Order>('/orders', {
        method: 'POST',
        body: {
          shippingAddr: shippingAddr.trim(),
          deliveryArea,
          paymentMethod,
          ...(paymentMethod !== 'COD'
            ? {
                senderNumber: senderNumber.trim(),
                trxId: trxId.trim(),
              }
            : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });

      await clear();
      router.push(`/account/orders/${order.id}?placed=1`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not place your order.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return <div className="container mx-auto px-4 py-12" />;
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-12" />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
        <div className="mt-6">
          <EmptyState
            title="Your cart is empty"
            message="Add something to your cart before checking out."
            action={
              <Link
                href="/products"
                className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Browse products
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span>
        <Link href="/cart">Cart</Link> <span className="mx-1">/</span> Checkout
      </nav>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Checkout</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          {/* Shipping */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">
              Delivery address
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="shippingAddr"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Full address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="shippingAddr"
                  required
                  rows={3}
                  value={shippingAddr}
                  onChange={(event) => setShippingAddr(event.target.value)}
                  placeholder="House / Flat, Road, Area, Dhaka 1213, Bangladesh"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Delivery area <span className="text-red-500">*</span>
                </span>
                <DeliveryAreaPicker
                  value={deliveryArea}
                  onChange={setDeliveryArea}
                />
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Order note{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. Please call before delivery"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">
              Payment method
            </h2>

            <div className="mt-4">
              <PaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
                merchant={merchant}
                senderNumber={senderNumber}
                onSenderNumberChange={setSenderNumber}
                trxId={trxId}
                onTrxIdChange={setTrxId}
              />
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-semibold text-gray-800">Order summary</h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-emerald-50">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">
                      🌿
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × {formatBDT(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {formatBDT(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800">
                {formatBDT(subtotal)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-sm text-gray-500">Delivery</span>
              <span className="font-medium text-gray-800">
                {formatBDT(deliveryFee)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="text-xl font-bold text-emerald-800">
              {formatBDT(total)}
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? 'Placing order…' : 'Place order'}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            Need help? Call{' '}
            <a href="tel:01735262232" className="font-medium hover:underline">
              01735262232
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
