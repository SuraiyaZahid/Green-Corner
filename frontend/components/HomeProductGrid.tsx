'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, buildQuery } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/EmptyState';
import type { Product, ProductListResponse } from '@/lib/types';

/** How many products each "Load more" click reveals. */
const PAGE_SIZE = 12;

/**
 * The homepage product grid.
 *
 * Every product is listed here, not just the featured ones. The first page
 * is passed in from the server so the grid is present in the initial HTML;
 * "Load more" then pulls the rest in from the API.
 *
 * A "Load more" button is used instead of numbered pagination so the page
 * never navigates away from the hero and category sections above it.
 */
export function HomeProductGrid({
  initialProducts,
  initialTotal,
  initialTotalPages,
}: {
  initialProducts: Product[];
  initialTotal: number;
  initialTotalPages: number;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const data = await apiRequest<ProductListResponse>(
        `/products${buildQuery({ page: nextPage, limit: PAGE_SIZE })}`,
        { auth: false },
      );

      setProducts((current) => [...current, ...data.items]);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load more products. Is the API running?',
      );
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  const hasMore = page < totalPages;

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        Showing {products.length} of {total} product{total === 1 ? '' : 's'}
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showActions />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-lg border border-emerald-700 bg-white px-8 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore
              ? 'Loading…'
              : `Load more products (${total - products.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}

export default HomeProductGrid;
