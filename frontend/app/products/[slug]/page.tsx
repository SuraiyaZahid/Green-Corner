import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiRequest, formatBDT } from '@/lib/api';
import { StockBadge } from '@/components/Badge';
import { AddToCartButton } from '@/components/AddToCartButton';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await apiRequest<Product>(`/products/${slug}`, { auth: false });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) {
    return { title: 'Product not found' };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const gallery = [product.imageUrl, ...(product.images ?? [])].filter(
    (url): url is string => Boolean(url),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-4 text-xs text-gray-500">
        Home <span className="mx-1">/</span>{' '}
        <Link href="/products">Products</Link> <span className="mx-1">/</span>{' '}
        <Link href={`/category/${product.category.slug}`}>
          {product.category.name}
        </Link>{' '}
        <span className="mx-1">/</span> {product.name}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-emerald-50">
            {gallery.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">
                🌿
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(1, 5).map((url) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-emerald-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link
            href={`/category/${product.category.slug}`}
            className="text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:underline"
          >
            {product.category.name}
          </Link>

          <h1 className="mt-2 text-2xl font-bold text-gray-800 md:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-emerald-800">
              {formatBDT(product.price)}
            </span>
            <StockBadge stock={product.stock} />
          </div>

          <p className="mt-5 text-sm leading-relaxed text-gray-600">
            {product.description}
          </p>

          {product.careInstructions && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h2 className="flex items-center gap-2 font-semibold text-emerald-900">
                <span aria-hidden="true">🌱</span> Care Instructions
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900/85">
                {product.careInstructions}
              </p>
            </div>
          )}

          <div className="mt-6">
            <AddToCartButton
              productId={product.id}
              stock={product.stock}
              price={product.price}
            />
          </div>

          <div className="mt-6 grid gap-3 border-t border-gray-200 pt-5 text-sm text-gray-600 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <span aria-hidden="true">🚚</span>
              <span>Delivery across Bangladesh</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden="true">💵</span>
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden="true">📞</span>
              <a href="tel:01735262232" className="hover:underline">
                01735262232
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
