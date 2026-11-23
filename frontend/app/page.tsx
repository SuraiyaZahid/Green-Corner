import Link from 'next/link';
import { apiRequest, buildQuery } from '@/lib/api';
import { HomeProductGrid } from '@/components/HomeProductGrid';
import type { Product, ProductListResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** How many products the homepage shows before "Load more" is offered. */
const PAGE_SIZE = 12;

export default async function HomePage() {
  let products: Product[] = [];
  let total = 0;
  let totalPages = 1;

  try {
    const productData = await apiRequest<ProductListResponse>(
      `/products${buildQuery({ page: 1, limit: PAGE_SIZE })}`,
      { auth: false },
    );
    products = productData.items;
    total = productData.total;
    totalPages = productData.totalPages;
  } catch {
    // The API may not be running yet — render the page with empty sections.
  }

  return (
    <div>
      {/* Compact hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-brand-800 text-white">
        {/* Layered botanical accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {/* Soft radial glow */}
          <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />
          {/* Delicate leaf / circle accents */}
          <div className="absolute right-[12%] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute right-[7%] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-white/[0.07]" />
          <div className="absolute left-[55%] -top-10 h-40 w-24 rotate-[35deg] rounded-[100%] border border-white/[0.07]" />
          <div className="absolute bottom-2 left-[22%] h-20 w-16 -rotate-[25deg] rounded-[100%] border border-white/[0.06]" />
        </div>

        <div className="container relative mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-7 md:py-9">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
              Grow something beautiful at home
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/85">
              Plants, compost, tools, seeds and pots — delivered across
              Bangladesh.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {[
              { emoji: '🌿', label: 'Fresh & Healthy Plants' },
              { emoji: '🚚', label: 'Nationwide Delivery' },
              { emoji: '💵', label: 'Cash on Delivery' },
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm transition-colors hover:bg-white/15 md:text-sm"
              >
                <span aria-hidden="true">{badge.emoji}</span>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* All products */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                All Products
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Every plant, compost, tool, seed packet and pot we sell.
              </p>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Filter & sort →
            </Link>
          </div>

          <HomeProductGrid
            initialProducts={products}
            initialTotal={total}
            initialTotalPages={totalPages}
          />
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
