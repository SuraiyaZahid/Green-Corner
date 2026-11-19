import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/types';

/**
 * Demo imagery for categories that have no uploaded image yet.
 *
 * A few categories predate the Cloudinary upload flow, so without this map
 * their cards would show a bare leaf glyph. Every slug gets a photograph that
 * actually depicts the category; anything not listed falls back to a generic
 * garden shot so newly added categories still look finished.
 *
 * The photo IDs were pulled from Unsplash search pages and each URL was
 * verified to return a 200 with an image content type — dead Unsplash IDs
 * are common and silently render as broken images.
 */
const CATEGORY_DEMO_IMAGES: Record<string, string> = {
  // Bonsai tree in a shallow ceramic pot.
  bonsai: 'https://images.unsplash.com/photo-1470364693235-a4fe27c60914?w=800',
  // Compost / soil close-up.
  compost: 'https://images.unsplash.com/photo-1592484773536-263bf52e81fc?w=800',
  'compost-fertilizers':
    'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800',
  fertilizer: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800',
  // Flower seeds / mixed flower bed.
  'flower-seed': 'https://images.unsplash.com/photo-1527451668186-d17acdb68207?w=800',
  'flower-seeds': 'https://images.unsplash.com/photo-1527451668186-d17acdb68207?w=800',
  // Blossoming tree branches against the sky.
  'flower-tree': 'https://images.unsplash.com/photo-1502246170363-97cb63f36c81?w=800',
  // Pruning shears, gloves and other hand tools.
  'gardening-equipment':
    'https://images.unsplash.com/photo-1523301551780-cd17359a95d0?w=800',
  // Macrame hanging basket planter.
  'hanging-tob': 'https://images.unsplash.com/photo-1550074930-5d91cddbf0cc?w=800',
  // Palm foliage — a bright indoor plant.
  'indoor-plant': 'https://images.unsplash.com/photo-1506634064465-7dab4de896ed?w=800',
  'indoor-plants': 'https://images.unsplash.com/photo-1506634064465-7dab4de896ed?w=800',
  // A garden bed of outdoor plants.
  'outdoor-plant': 'https://images.unsplash.com/photo-1444392061186-9fc38f84f726?w=800',
  'outdoor-plants': 'https://images.unsplash.com/photo-1444392061186-9fc38f84f726?w=800',
  // Stacked terracotta pots.
  tob: 'https://images.unsplash.com/photo-1468531390554-9f62f9767a87?w=800',
  'pots-planters': 'https://images.unsplash.com/photo-1468531390554-9f62f9767a87?w=800',
  // Potatoes lifted from the soil.
  'vegtable-seed': 'https://images.unsplash.com/photo-1591857172651-1c9fde426c84?w=800',
  'vegetable-seed': 'https://images.unsplash.com/photo-1591857172651-1c9fde426c84?w=800',
  // Labelled seed packets.
  'seed-packets': 'https://images.unsplash.com/photo-1523302270222-0f256786563c?w=800',
};

/** Shown for any category we have no specific photograph for. */
const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1444392061186-9fc38f84f726?w=800';

/**
 * Resolves the image for a category: its own upload if it has one,
 * otherwise a demo photograph chosen from its slug.
 */
export function categoryImage(slug: string): string {
  const key = slug.trim().toLowerCase();
  return CATEGORY_DEMO_IMAGES[key] ?? DEFAULT_CATEGORY_IMAGE;
}

export function CategoryCard({ category }: { category: Category }) {
  const image = category.imageUrl || categoryImage(category.slug);

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-card"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-emerald-50">
        <Image
          src={image}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 50vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
  );
}

export default CategoryCard;
