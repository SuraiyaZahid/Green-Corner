/**
 * Checks the product-detail stepper clamping from the server's point of
 * view: with a product that has N units in stock, the API must accept at
 * most N and the "in cart" line must be reported back so the UI can clamp
 * the stepper to the remaining availability.
 *
 *   node scripts/stepper-clamp-test.js
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
  return { status: response.status, payload: text ? JSON.parse(text) : null };
}

async function main() {
  const email = `clamp-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const register = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Clamp Tester', email, password, phone: '01700000000' },
  });
  const token = register.payload.accessToken;

  const products = await call('/products?limit=50', { token });
  const product = products.payload.items.find((p) => p.stock >= 2);
  console.log(`\nusing "${product.name}" (stock ${product.stock})\n`);

  // Fill the cart up to the stock.
  const filled = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: product.stock },
  });
  check('filling the cart to the stock limit succeeds',
    filled.status === 201 || filled.status === 200,
    JSON.stringify(filled.payload));

  const line = filled.payload.items.find((i) => i.productId === product.id);
  check('the cart line reports the full stock', line.quantity === product.stock,
    `quantity=${line.quantity}`);

  // The UI clamps the stepper to remainingAvailable, which is now 0, so
  // it never offers more. The API must still reject one more unit.
  const oneMore = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 1 },
  });
  check('adding one more unit beyond the stock is rejected',
    oneMore.status === 409, `status=${oneMore.status}`);
  check('the rejection explains the limit',
    typeof oneMore.payload.message === 'string' &&
      oneMore.payload.message.includes('in stock'),
    JSON.stringify(oneMore.payload));

  // Updating the line beyond the stock is rejected too.
  const overUpdate = await call(`/cart/items/${line.id}`, {
    method: 'PATCH',
    token,
    body: { quantity: product.stock + 1 },
  });
  check('raising the line above the stock is rejected',
    overUpdate.status === 409, `status=${overUpdate.status}`);

  await call('/cart', { method: 'DELETE', token });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
