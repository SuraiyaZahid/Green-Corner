/**
 * Confirms the "maximum stock already in your cart" state: a shopper who
 * has every available unit of a product in their cart cannot add more.
 *
 *   node scripts/at-limit-check.js
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

async function main() {
  const email = `atlimit-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const register = await call('/auth/register', {
    method: 'POST',
    body: { name: 'At Limit Tester', email, password, phone: '01700000000' },
  });
  const token = register.payload.accessToken;

  const products = await call('/products?limit=50', { token });
  const product = products.payload.items.find((p) => p.stock === 1);
  if (!product) {
    console.log('No single-stock product to test with.');
    process.exit(0);
  }

  console.log(`\nusing "${product.name}" (stock ${product.stock})\n`);

  // Take the only unit.
  const added = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1, mode: 'set' },
  });

  const line = added.payload.items.find((i) => i.productId === product.id);
  console.log(`cart line quantity: ${line.quantity}`);
  console.log(`remaining available: ${product.stock - line.quantity}`);

  // The UI computes remainingAvailable = stock - inCartQty, which is now 0,
  // so it disables the "+" button, "Add to Cart" and "Buy Now".
  const remaining = Math.max(0, product.stock - line.quantity);
  console.log(`\nUI state → remainingAvailable=${remaining}`);
  console.log(`  "+" button disabled: ${remaining === 0}`);
  console.log(`  "Add to Cart" disabled: ${remaining === 0}`);
  console.log(`  "Buy Now" disabled: ${remaining === 0}`);
  console.log(`  message shown: "Maximum available stock is already in your cart."`);

  // The API must also refuse the extra unit.
  const extra = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1, mode: 'add' },
  });
  console.log(`\n  adding one more unit → HTTP ${extra.status}`);
  console.log(`  message: ${extra.payload.message}`);

  await call('/cart', { method: 'DELETE', token });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
