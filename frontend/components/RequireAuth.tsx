'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

/**
 * Client-side route guard. The JWT lives in localStorage, so the check has
 * to happen on the client after the auth context has hydrated.
 *
 * When `adminOnly` is set the caller must hold the ADMIN role. A signed-in
 * user without that role is sent to the Access Denied page; an anonymous
 * visitor is sent to the login page with a return path.
 */
export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const redirect = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    if (adminOnly && !isAdmin) {
      router.replace('/admin/access-denied');
    }
  }, [user, loading, isAdmin, adminOnly, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-12" />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-gray-500">Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireAuth;
