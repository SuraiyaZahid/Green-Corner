'use client';

import { formatBDT } from '@/lib/api';
import { DELIVERY_AREA_OPTIONS, DELIVERY_FEES } from '@/lib/delivery';
import type { DeliveryArea } from '@/lib/types';

interface DeliveryAreaPickerProps {
  value: DeliveryArea;
  onChange: (area: DeliveryArea) => void;
  error?: string;
}

/**
 * Lets the customer choose where the order is delivered. The fee shown next to
 * each option is the amount the server will add to the order total.
 */
export function DeliveryAreaPicker({
  value,
  onChange,
  error,
}: DeliveryAreaPickerProps) {
  return (
    <div>
      <div className="space-y-3">
        {DELIVERY_AREA_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              value === option.id
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
          >
            <input
              type="radio"
              name="deliveryArea"
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="mt-1 h-4 w-4 accent-emerald-700"
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-gray-800">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {option.description}
              </span>
            </span>
            <span className="text-sm font-semibold text-emerald-800">
              {formatBDT(DELIVERY_FEES[option.id])}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export default DeliveryAreaPicker;
