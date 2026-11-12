/**
 * Removes residue left behind by interrupted smoke-test runs:
 * categories and products whose names start with the smoke-test prefixes.
 *
 *   node scripts/cleanup-test-data.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    where: { name: { startsWith: 'Smoke Category' } },
    select: { id: true, name: true },
  });

  for (const category of categories) {
    await prisma.product.deleteMany({ where: { categoryId: category.id } });
    await prisma.category.delete({ where: { id: category.id } });
    console.log(`Removed category: ${category.name}`);
  }

  const products = await prisma.product.findMany({
    where: { name: { startsWith: 'Smoke Test Plant' } },
    select: { id: true, name: true },
  });

  for (const product of products) {
    await prisma.cartItem.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    console.log(`Removed product: ${product.name}`);
  }

  console.log('Cleanup complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
