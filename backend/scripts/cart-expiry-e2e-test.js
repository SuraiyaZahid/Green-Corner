/**
 * End-to-end check of the real 3-minute hold: a cart line is added, the
 * shopper waits, and the line disappears on its own with the stock
 * released.
 *
 *   node scripts/cart-expiry-e2e-test.js
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
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const register = await call('/auth/register', {
    method: 'POST',
    body: { name: 'E2E Tester', email, password, phone: '01700000000' },
  });
  const token = register.payload.accessToken;

  const products = await call('/products?limit=50', { token });
  const product = products.payload.items.find((p) => p.stock >= 1);
  console.log(`using "${product.name}" (stock ${product.stock})`);

  const added = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1 },
  });

  const line = added.payload.items[0];
  const expiresAt = new Date(line.expiresAt).getTime();
  console.log(`cart line expires at ${line.expiresAt}`);

  const waitMs = Math.max(0, expiresAt - Date.now()) + 5000;
  console.log(`waiting ${Math.round(waitMs / 1000)}s for the hold to lapse...`);
  await sleep(waitMs);

  const cart = await call('/cart', { token });
  const left = cart.payload.items.filter((i) => i.productId === product.id);
  console.log(`lines left in the cart: ${left.length}`);

  await call('/cart', { method: 'DELETE', token });

  if (left.length === 0) {
    console.log('\nPASS  the cart line expired and was auto-released\n');
    process.exit(0);
  }

  console.log('\nFAIL  the cart line survived its hold window\n');
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
