'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, buildQuery } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ProductGridSkeleton } from '@/components/EmptyState';
import type { Category, Product, ProductListResponse } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

export function ProductGrid({
  lockedCategory,
  showFilters = true,
}: {
  lockedCategory?: string;
  showFilters?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const category = lockedCategory ?? searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const currentPage = Number(searchParams.get('page') ?? '1');

  useEffect(() => {
    apiRequest<Category[]>('/categories', { auth: false })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const query = buildQuery({
      category: lockedCategory ?? category,
      search: lockedCategory ? '' : search,
      sort,
      page: currentPage,
      limit: 12,
    });

    apiRequest<ProductListResponse>(`/products${query}`, {
      auth: false,
      signal: controller.signal,
    })
      .then((data) => {
        setProducts(data.items);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load products. Is the API running?',
        );
        setProducts([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category, search, sort, currentPage, lockedCategory]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (!('page' in updates)) {
      params.delete('page');
    }

    // On a category page the category is part of the path, so pagination
    // and sorting must stay on that path instead of jumping to /products.
    if (lockedCategory) {
      const query = params.toString();
      router.push(`/category/${lockedCategory}${query ? `?${query}` : ''}`);
      return;
    }

    router.push(`/products?${params.toString()}`);
  };

  return (
    <div>
      {showFilters && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div>
              <label
                htmlFor="product-search"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Search
              </label>
              <input
                id="product-search"
                type="search"
                defaultValue={search}
                placeholder="Search plants, compost, tools…"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    updateParams({ search: event.currentTarget.value.trim() });
                  }
                }}
                onBlur={(event) =>
                  updateParams({ search: event.currentTarget.value.trim() })
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="category-filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Category
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(event) =>
                  updateParams({ category: event.target.value })
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 md:w-56"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sort-filter"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Sort by
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 md:w-52"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(search || category) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500">Active filters:</span>
              {search && (
                <button
                  type="button"
                  onClick={() => updateParams({ search: '' })}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 hover:bg-emerald-200"
                >
                  “{search}” ✕
                </button>
              )}
              {category && !lockedCategory && (
                <button
                  type="button"
                  onClick={() => updateParams({ category: '' })}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 hover:bg-emerald-200"
                >
                  {categories.find((item) => item.slug === category)?.name ??
                    category}{' '}
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <p className="mt-1 text-xs text-red-600">
            Start the backend with <code>npm run dev</code> from the project
            root.
          </p>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          message="Try a different search term or clear the filters to see everything we have in stock."
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Showing {products.length} of {total} product{total === 1 ? '' : 's'}
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => updateParams({ page: String(pageNumber) })}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                      pageNumber === page
                        ? 'bg-emerald-700 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductGrid;
