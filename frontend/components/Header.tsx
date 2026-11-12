'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import type { Category } from '@/lib/types';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Separate flags so the Categories flyout and the account dropdown do not
  // open and close together.
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoriesTriggerRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    apiRequest<Category[]>('/categories', { auth: false })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Each menu closes only when the click landed outside of that menu.
      // Checking the menu's own trigger is what keeps the dropdown from
      // closing on mousedown and immediately re-opening on click.
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(target) &&
        !categoriesTriggerRef.current?.contains(target)
      ) {
        setCategoriesOpen(false);
      }

      if (
        accountRef.current &&
        !accountRef.current.contains(target) &&
        !accountTriggerRef.current?.contains(target)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /**
   * Signs the user out and closes the dropdown. The logout call is wrapped so
   * the menu never stays mounted with a stale, signed-out user behind it.
   */
  const handleSignOut = useCallback(async () => {
    setAccountOpen(false);
    setCategoriesOpen(false);
    setMobileOpen(false);
    await logout();
  }, [logout]);

  /** The two menus are mutually exclusive — opening one closes the other. */
  const toggleCategories = useCallback(() => {
    setCategoriesOpen((open) => {
      const next = !open;
      if (next) setAccountOpen(false);
      return next;
    });
  }, []);

  const toggleAccount = useCallback(() => {
    setAccountOpen((open) => {
      const next = !open;
      if (next) setCategoriesOpen(false);
      return next;
    });
  }, []);

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href
        ? 'text-emerald-700'
        : 'text-gray-600 hover:text-emerald-700'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-lg font-bold text-white">
              G
            </span>
            <span className="text-lg font-bold text-emerald-800">
              Green Corner
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className={navLinkClass('/')}>
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => {
                setCategoriesOpen(true);
                setAccountOpen(false);
              }}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                type="button"
                ref={categoriesTriggerRef}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-emerald-700"
                onClick={toggleCategories}
                aria-expanded={categoriesOpen}
              >
                Categories
                <span aria-hidden="true" className="text-xs">
                  ▾
                </span>
              </button>

              {categoriesOpen && (
                <div
                  ref={categoriesRef}
                  className="absolute left-0 top-full w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <span>{category.name}</span>
                      {category._count ? (
                        <span className="text-xs text-gray-400">
                          {category._count.products}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                  {categories.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-400">
                      No categories yet
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <Link href="/products" className={navLinkClass('/products')}>
              All Products
            </Link>

            {isAdmin && (
              <Link href="/admin" className={navLinkClass('/admin')}>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:border-emerald-600 hover:text-emerald-700"
              aria-label="Cart"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-semibold text-white">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  ref={accountTriggerRef}
                  onClick={toggleAccount}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-emerald-600"
                  aria-expanded={accountOpen}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-24 truncate">{user.name}</span>
                </button>
                {accountOpen && (
                  <div
                    ref={accountRef}
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50"
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 md:inline-flex"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            <Link href="/" className="rounded px-2 py-2 text-sm text-gray-700">
              Home
            </Link>
            <Link href="/products" className="rounded px-2 py-2 text-sm text-gray-700">
              All Products
            </Link>
            <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Categories
            </p>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded px-2 py-2 text-sm text-gray-600"
              >
                {category.name}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="rounded px-2 py-2 text-sm text-gray-700">
                Admin Panel
              </Link>
            )}
            {user ? (
              <>
                <Link href="/account" className="rounded px-2 py-2 text-sm text-gray-700">
                  My Profile
                </Link>
                <Link
                  href="/account/orders"
                  className="rounded px-2 py-2 text-sm text-gray-700"
                >
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded px-2 py-2 text-left text-sm text-red-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
