import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductGridSkeleton } from '@/components/EmptyState';

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse plants, Joibo Sar compost, gardening equipment, seed packets and pots available at Green Corner.',
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span> Products
      </nav>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        All Products
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Plants, compost, tools, seeds and pots — everything for your garden.
      </p>

      <div className="mt-6">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </div>
    </div>
  );
}
