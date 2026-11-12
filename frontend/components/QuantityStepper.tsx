'use client';

import { useState } from 'react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className = '',
}: QuantityStepperProps) {
  const [input, setInput] = useState(String(value));

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const handleInput = (value: string) => {
    setInput(value);
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = Number(input);
    const next = Number.isNaN(parsed) ? min : clamp(parsed);
    setInput(String(next));
    onChange(next);
  };

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg border border-gray-300 ${className}`}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        value={input}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => handleInput(event.target.value)}
        onBlur={handleBlur}
        className="h-10 w-14 border-x border-gray-300 text-center text-sm font-semibold text-gray-800 outline-none focus:bg-emerald-50/40 disabled:opacity-50"
        aria-label="Quantity"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default QuantityStepper;
