import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { apiRequest } from '@/lib/api';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductGridSkeleton } from '@/components/EmptyState';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const categories = await apiRequest<Category[]>('/categories', { auth: false });
    const category = categories.find((item) => item.slug === params.slug);
    return {
      title: category?.name ?? 'Category',
      description:
        category?.description ??
        `Shop ${category?.name ?? 'products'} at Green Corner.`,
    };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  let categories: Category[] = [];

  try {
    categories = await apiRequest<Category[]>('/categories', { auth: false });
  } catch {
    // A transient API failure must not look like a missing category —
    // render an empty category instead of a 404.
    categories = [];
  }

  const category = categories.find((item) => item.slug === params.slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-xs text-gray-500">
        Home <span className="mx-1">/</span>{' '}
        <Link href="/products">Products</Link> <span className="mx-1">/</span>{' '}
        {category.name}
      </nav>

      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {category.description}
        </p>
      )}

      <div className="mt-6">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid lockedCategory={category.slug} showFilters={false} />
        </Suspense>
      </div>
    </div>
  );
}
