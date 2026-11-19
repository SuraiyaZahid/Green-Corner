'use client';

import { useEffect, useState } from 'react';

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
  const [editing, setEditing] = useState(false);

  // Keep the visible number in sync with the value that comes back from
  // the server (or from the +/- buttons). Without this the input would keep
  // showing whatever was typed last and the count would look stuck.
  useEffect(() => {
    if (!editing) setInput(String(value));
  }, [value, editing]);

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const handleInput = (value: string) => {
    setInput(value);
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = Number(input);
    const next = Number.isNaN(parsed) ? min : clamp(parsed);
    setInput(String(next));
    onChange(next);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    setInput(String(next));
    onChange(next);
  };

  const atMin = disabled || value <= min;
  const atMax = disabled || value >= max;

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white ${className}`}
    >
      <button
        type="button"
        disabled={atMin}
        onClick={() => step(-1)}
        className="flex h-10 w-10 items-center justify-center text-lg font-bold leading-none text-gray-800 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-400"
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
        onFocus={() => setEditing(true)}
        onChange={(event) => handleInput(event.target.value)}
        onBlur={handleBlur}
        className="h-10 w-14 border-x border-gray-300 bg-white text-center text-base font-bold text-gray-900 outline-none focus:bg-emerald-50/40 disabled:opacity-50"
        aria-label="Quantity"
      />
      <button
        type="button"
        disabled={atMax}
        onClick={() => step(1)}
        className="flex h-10 w-10 items-center justify-center text-lg font-bold leading-none text-gray-800 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-400"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default QuantityStepper;
