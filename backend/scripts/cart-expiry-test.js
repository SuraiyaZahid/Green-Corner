/**
 * Focused check for the cart hold behaviour:
 *  - a cart line is held for 3 minutes and then auto-released
 *  - "Buy Now" on a product already in the cart does not trip the stock check
 *  - the cart reports an expiry for every line
 *
 * Run with the backend listening on http://localhost:4000
 *
 *   node scripts/cart-expiry-test.js
 */
const API = process.env.API_URL || 'http://localhost:4000/api/v1';

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

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
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  return { status: response.status, payload };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const email = `cart-expiry-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const register = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Expiry Tester', email, password, phone: '01700000000' },
  });

  if (register.status !== 201 && register.status !== 200) {
    console.log('Could not register a test user:', JSON.stringify(register.payload));
    process.exit(1);
  }

  const token = register.payload.accessToken;

  const products = await call('/products?limit=50', { token });
  const list = products.payload.items || [];
  check('products are listed', list.length > 0);

  // Find a product with enough stock to exercise the limits.
  const product = list.find((p) => p.stock >= 3);
  if (!product) {
    console.log('No product with enough stock to test with.');
    process.exit(1);
  }

  console.log(`\nUsing "${product.name}" (stock ${product.stock})\n`);

  // --- 1. Add to cart, check the expiry is reported and in the future.
  const added = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1 },
  });
  check('add to cart succeeds', added.status === 201 || added.status === 200,
    JSON.stringify(added.payload));

  const cart = added.payload;
  check('cart reports a hold window', cart.holdMinutes === 3,
    `holdMinutes=${cart.holdMinutes}`);

  const line = (cart.items || [])[0];
  check('cart line carries an expiry', Boolean(line && line.expiresAt));

  const expiresInMs = line ? new Date(line.expiresAt).getTime() - Date.now() : 0;
  check('expiry is roughly 3 minutes out',
    expiresInMs > 150000 && expiresInMs <= 180000,
    `${Math.round(expiresInMs / 1000)}s`);

  // --- 2. "Buy Now" on an item already in the cart must not trip the stock
  //        check. The set mode replaces the line instead of adding to it.
  const reAdded = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 2, mode: 'set' },
  });
  check('re-adding an in-cart product succeeds',
    reAdded.status === 201 || reAdded.status === 200,
    JSON.stringify(reAdded.payload));

  const reLine = (reAdded.payload.items || [])[0];
  check('set mode replaces the line, it does not accumulate',
    reLine.quantity === 2, `quantity=${reLine.quantity}`);

  // --- 3. Plain "Add to Cart" accumulates onto the existing line.
  const accumulated = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1, mode: 'add' },
  });
  const accLine = (accumulated.payload.items || [])[0];
  check('add mode accumulates onto the existing line',
    accLine.quantity === 3, `quantity=${accLine.quantity}`);

  // --- 4. Adding beyond the stock is still rejected with a clear message.
  const overStock = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: product.stock + 5 },
  });
  check('adding beyond stock is rejected', overStock.status === 409,
    `status=${overStock.status}`);

  // --- 5. Adding one more unit when the line already holds the full stock
  //        must be rejected too, in both modes.
  const atLimit = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: product.stock, mode: 'set' },
  });
  check('filling the line to the stock limit succeeds',
    atLimit.status === 201 || atLimit.status === 200,
    JSON.stringify(atLimit.payload));

  const oneTooMany = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1, mode: 'add' },
  });
  check('adding one more unit at the stock limit is rejected',
    oneTooMany.status === 409, `status=${oneTooMany.status}`);

  // --- 4. The line must expire and be released. Rather than waiting the
  //        full 3 minutes, expire the row directly and confirm the read
  //        path purges it.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.cartItem.updateMany({
      where: { productId: product.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const afterExpiry = await call('/cart', { token });
    const remaining = (afterExpiry.payload.items || []).filter(
      (item) => item.productId === product.id,
    );
    check('expired line is purged on read', remaining.length === 0,
      `${remaining.length} line(s) left`);

    const swept = await call('/products?limit=50', { token });
    check('products still list after the sweep', swept.status === 200);

    // --- 5. The released line can be added again.
    const readded = await call('/cart/items', {
      method: 'POST',
      token,
      body: { productId: product.id, quantity: 1 },
    });
    check('a released product can be added again',
      readded.status === 201 || readded.status === 200,
      JSON.stringify(readded.payload));

    // Clean up after the test.
    await call('/cart', { method: 'DELETE', token });
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
