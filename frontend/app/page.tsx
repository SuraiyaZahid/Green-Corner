import Link from 'next/link';
import Image from 'next/image';
import { apiRequest, formatBDT } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import type { Category, Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let categories: Category[] = [];
  let featured: Product[] = [];

  try {
    const [categoryData, productData] = await Promise.all([
      apiRequest<Category[]>('/categories', { auth: false }),
      apiRequest<Product[]>('/products/featured', { auth: false }),
    ]);
    categories = categoryData;
    featured = productData;
  } catch {
    // The API may not be running yet — render the page with empty sections.
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 text-white">
        <div className="container mx-auto grid gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Kuril Bisso Road, Dhaka
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
              Grow something beautiful at home
            </h1>
            <p className="mt-4 max-w-md text-emerald-50/90">
              Indoor and outdoor plants, Joibo Sar compost, gardening tools, seed
              packets and pots — delivered across Bangladesh with Cash on
              Delivery, bKash and Nagad.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-800 transition-transform hover:-translate-y-0.5"
              >
                Shop All Products
              </Link>
              <Link
                href="/products?category=indoor-plants"
                className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Indoor Plants
              </Link>
            </div>
          </div>

          <div className="relative hidden aspect-square md:block">
            <div className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-sm" />
            <div className="absolute inset-8 flex items-center justify-center text-8xl">
              🪴
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Everything you need to start and grow a garden.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card"
            >
              <div className="relative aspect-4/3 bg-emerald-50">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">
                    🌿
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-emerald-800">
                  {category.name}
                </h3>
                {category._count ? (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {category._count.products} product
                    {category._count.products === 1 ? '' : 's'}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Featured Products
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Hand picked favourites from our collection.
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              View all →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              Featured products will appear here once the API is running.
            </div>
          )}
        </div>
      </section>

      {/* Why us */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              emoji: '🚚',
              title: 'Delivery across Bangladesh',
              body: 'We deliver to every district. Inside Dhaka usually takes 1–2 days.',
            },
            {
              emoji: '💵',
              title: 'Cash on Delivery',
              body: 'Pay when your order arrives, or send bKash / Nagad ahead of time.',
            },
            {
              emoji: '🌿',
              title: 'Quality checked plants',
              body: 'Every plant is inspected and packed with care before dispatch.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl" aria-hidden="true">
                {item.emoji}
              </div>
              <h3 className="mt-3 font-semibold text-gray-800">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-emerald-900 py-10 text-white">
        <div className="container mx-auto grid gap-6 px-4 text-center md:grid-cols-3 md:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Call us
            </p>
            <a
              href="tel:01735262232"
              className="mt-1 block text-xl font-bold hover:underline"
            >
              01735262232
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Email
            </p>
            <a
              href="mailto:suraiyazahid085@gmail.com"
              className="mt-1 block text-lg font-semibold hover:underline"
            >
              suraiyazahid085@gmail.com
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Visit us
            </p>
            <p className="mt-1 text-lg font-semibold">
              Kuril Bisso Road, Dhaka, Bangladesh
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
