'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiRequest, formatDate } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/components/RequireAuth';
import type { User } from '@/lib/types';

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  if (!user) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);

    try {
      await apiRequest<User>('/auth/profile', {
        method: 'PATCH',
        body: {
          name,
          phone: phone || undefined,
          ...(password ? { password } : {}),
        },
      });
      await refreshUser();
      setPassword('');
      setMessage({ text: 'Profile updated successfully.', type: 'success' });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Could not update profile.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span> Account
      </nav>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        My Profile
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit space-y-1 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <Link
            href="/account"
            className="block rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
          >
            Profile
          </Link>
          <Link
            href="/account/orders"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            My Orders
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {message && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Email cannot be changed here.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Mobile number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="01735262232"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  New password{' '}
                  <span className="font-normal text-gray-400">
                    (leave blank to keep current)
                  </span>
                </label>
                <input
                  id="password"
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-5">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
              <p className="text-xs text-gray-500">
                Member since {formatDate(user.createdAt ?? new Date().toISOString())}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
