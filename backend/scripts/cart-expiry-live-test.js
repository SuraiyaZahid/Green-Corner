/**
 * Verifies the 30-second background sweep releases an expired cart line
 * without anybody reading the cart.
 *
 *   node scripts/cart-expiry-live-test.js
 */
const API = process.env.API_URL || 'http://localhost:4000/api/v1';

async function call(path, options = {}) {
  const { body, token, method = 'GET' } = options;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  return { status: response.status, payload: text ? JSON.parse(text) : null };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const email = `sweep-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const register = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Sweep Tester', email, password, phone: '01700000000' },
  });
  const token = register.payload.accessToken;

  const products = await call('/products?limit=50', { token });
  const product = products.payload.items.find((p) => p.stock >= 1);

  await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1 },
  });

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  // Expire the line behind the API's back.
  await prisma.cartItem.updateMany({
    where: { productId: product.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });

  const before = await prisma.cartItem.count({
    where: { productId: product.id },
  });
  console.log(`lines before the sweep: ${before}`);

  // Wait for the background sweep without touching the cart endpoint.
  console.log('waiting 40s for the background sweep...');
  await sleep(40_000);

  const after = await prisma.cartItem.count({
    where: { productId: product.id },
  });
  console.log(`lines after the sweep:  ${after}`);

  await prisma.$disconnect();

  if (after === 0 && before > 0) {
    console.log('\nPASS  the background sweep released the expired line\n');
    process.exit(0);
  }

  console.log('\nFAIL  the expired line was not released by the sweep\n');
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
