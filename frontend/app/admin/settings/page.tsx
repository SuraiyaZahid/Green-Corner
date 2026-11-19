'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminNav } from '@/components/AdminNav';
import { DiscountBadge } from '@/components/DiscountBadge';
import { Toast } from '@/components/Toast';
import { Skeleton } from '@/components/EmptyState';
import type { StoreSettings } from '@/lib/types';

/** Quick-pick percentages offered next to the free-text input. */
const PRESETS = [5, 10, 15, 20, 25];

function StoreSettingsContent() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [value, setValue] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const load = async () => {
    try {
      const data = await apiRequest<StoreSettings>('/admin/settings');
      setSettings(data);
      setValue(String(data.discountPercentage));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load the store settings.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (percentage: number) => {
    setSaving(true);
    setError(null);

    try {
      const updated = await apiRequest<StoreSettings>('/admin/settings', {
        method: 'PATCH',
        body: { discountPercentage: percentage },
      });

      setSettings(updated);
      setValue(String(updated.discountPercentage));
      setToast({
        message:
          percentage > 0
            ? `Store-wide discount set to ${percentage}%.`
            : 'Store-wide discount removed.',
        type: 'success',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save the discount.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const percentage = Number(value);

    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
      setError('Enter a whole number between 0 and 100.');
      return;
    }

    void save(percentage);
  };

  const currentPercentage = settings?.discountPercentage ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminNav />

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Store settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control the store-wide discount applied to every product.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Discount control */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800">
              Store-wide discount
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              A single percentage off every product in the store. Set it to 0
              to remove the discount.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="discount-percentage"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Discount percentage
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="discount-percentage"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="h-11 w-32 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  <span className="text-sm text-gray-500">% off</span>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Quick set
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => void save(preset)}
                      disabled={saving}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        currentPercentage === preset
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                    >
                      {preset}% off
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void save(0)}
                    disabled={saving}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      currentPercentage === 0
                        ? 'border-gray-700 bg-gray-700 text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    No discount
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save discount'}
                </button>

                {currentPercentage !== Number(value) && (
                  <button
                    type="button"
                    onClick={() => setValue(String(currentPercentage))}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Current state */}
          <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800">Currently active</h2>

              {currentPercentage > 0 ? (
                <>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-3xl font-bold text-emerald-800">
                      {currentPercentage}%
                    </span>
                    <DiscountBadge percentage={currentPercentage} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Every product in the store is being sold at{' '}
                    {currentPercentage}% off. The discount is applied when the
                    order is placed, and existing orders keep the discount they
                    were placed with.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-3xl font-bold text-gray-800">0%</p>
                  <p className="mt-2 text-xs text-gray-500">
                    No store-wide discount is active. Products are sold at their
                    regular price.
                  </p>
                </>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800">How it works</h2>
              <ul className="mt-3 space-y-2 text-xs text-gray-500">
                <li>
                  The discount is resolved on the server, so the price shown and
                  the price charged always match.
                </li>
                <li>
                  Badges and struck-through prices appear on product cards,
                  product pages, the cart and checkout.
                </li>
                <li>
                  Changing the discount never rewrites orders that were already
                  placed.
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}

      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <RequireAuth adminOnly>
      <StoreSettingsContent />
    </RequireAuth>
  );
}
