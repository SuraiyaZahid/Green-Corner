'use client';

import type { MerchantDetails, PaymentMethod } from '@/lib/types';

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  merchant: MerchantDetails | null;
  senderNumber: string;
  onSenderNumberChange: (value: string) => void;
  trxId: string;
  onTrxIdChange: (value: string) => void;
  error?: string;
}

const METHODS: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    id: 'COD',
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order arrives.',
    emoji: '💵',
  },
  {
    id: 'BKASH',
    label: 'bKash',
    description: 'Send money to our bKash number, then submit the TrxID.',
    emoji: '📱',
  },
  {
    id: 'NAGAD',
    label: 'Nagad',
    description: 'Send money to our Nagad number, then submit the TrxID.',
    emoji: '📲',
  },
];

export function PaymentMethodPicker({
  value,
  onChange,
  merchant,
  senderNumber,
  onSenderNumberChange,
  trxId,
  onTrxIdChange,
  error,
}: PaymentMethodPickerProps) {
  const isMobilePayment = value === 'BKASH' || value === 'NAGAD';
  const merchantNumber =
    value === 'BKASH' ? merchant?.bkashNumber : merchant?.nagadNumber;

  return (
    <div>
      <div className="space-y-3">
        {METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              value === method.id
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={value === method.id}
              onChange={() => onChange(method.id)}
              className="mt-1 h-4 w-4 accent-emerald-700"
            />
            <span className="text-xl" aria-hidden="true">
              {method.emoji}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-gray-800">
                {method.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {method.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {isMobilePayment && (
        <div className="mt-4 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Send money to
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-900">
              {merchantNumber ?? '01735262232'}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {merchant?.accountType ?? 'Personal / Send Money'}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {merchant?.instructions ??
                'Send money to 01735262232 and submit your mobile number and TrxID at checkout.'}
            </p>
          </div>

          <div>
            <label
              htmlFor="senderNumber"
              className="mb-1 block text-sm font-medium text-gray-800"
            >
              Your mobile number <span className="text-red-500">*</span>
            </label>
            <input
              id="senderNumber"
              type="tel"
              required
              value={senderNumber}
              onChange={(event) => onSenderNumberChange(event.target.value)}
              placeholder="01735262232"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              The number you sent the money from.
            </p>
          </div>

          <div>
            <label
              htmlFor="trxId"
              className="mb-1 block text-sm font-medium text-gray-800"
            >
              Transaction ID (TrxID) <span className="text-red-500">*</span>
            </label>
            <input
              id="trxId"
              type="text"
              required
              value={trxId}
              onChange={(event) => onTrxIdChange(event.target.value)}
              placeholder="e.g. 8H2K4L9MNP"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              You will find this in your {value === 'BKASH' ? 'bKash' : 'Nagad'}{' '}
              transaction history. We verify it before dispatching.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export default PaymentMethodPicker;
