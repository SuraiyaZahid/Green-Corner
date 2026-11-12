'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function AdminAccessDeniedPage() {
  const { user, loading, isAdmin } = useAuth();

  // An administrator has no business on this page — send them to the dashboard.
  useEffect(() => {
    if (!loading && isAdmin) {
      window.location.replace('/admin');
    }
  }, [loading, isAdmin]);

  // An anonymous visitor is sent to the login page instead of being told
  // they lack permissions for an area they never had access to.
  useEffect(() => {
    if (!loading && !user) {
      window.location.replace('/login?redirect=%2Fadmin');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <div className="text-6xl" aria-hidden="true">
        🔒
      </div>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        This area is restricted to Green Corner administrators. Your account does
        not have permission to view the admin dashboard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/account"
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Go to my account
        </Link>
        <Link
          href="/products"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
