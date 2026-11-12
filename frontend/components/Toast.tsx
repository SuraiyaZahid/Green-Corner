'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
  onClose: () => void;
}

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-700',
};

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-sm animate-fade-in">
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${STYLES[type]}`}
        role="alert"
      >
        <span aria-hidden="true" className="mt-0.5">
          {type === 'success' ? '✓' : '!'}
        </span>
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-current opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default Toast;
