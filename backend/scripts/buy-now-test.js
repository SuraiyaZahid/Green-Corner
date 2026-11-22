/**
 * The exact scenario from the bug report: a product that is already in the
 * cart, then "Buy Now" is pressed on the product page.
 *
 * Before the fix this tripped "Only X unit(s) are in stock" because the
 * buy-now click added the quantity on top of the line the cart already
 * held. Now it replaces the line instead.
 *
 *   node scripts/buy-now-test.js
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
  const email = `buynow-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const register = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Buy Now Tester', email, password, phone: '01700000000' },
  });
  const token = register.payload.accessToken;

  const products = await call('/products?limit=50', { token });
  const product = products.payload.items.find((p) => p.stock >= 3);
  console.log(`\nusing "${product.name}" (stock ${product.stock})\n`);

  // The shopper already has 2 of this product in the cart.
  await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 2, mode: 'add' },
  });

  // On the product page they select 2 and press "Buy Now".
  const buyNow = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 2, mode: 'set' },
  });

  check('Buy Now on an item already in the cart succeeds',
    buyNow.status === 201 || buyNow.status === 200,
    `${buyNow.status} ${JSON.stringify(buyNow.payload)}`);

  check('no "in stock" error is raised',
    !(buyNow.payload && /in stock/i.test(String(buyNow.payload.message))),
    JSON.stringify(buyNow.payload && buyNow.payload.message));

  const line = (buyNow.payload.items || []).find(
    (i) => i.productId === product.id,
  );
  check('the line holds the Buy Now quantity', line.quantity === 2,
    `quantity=${line.quantity}`);
  check('the line stays within the stock', line.quantity <= product.stock);

  // The order can now be placed without the stock error.
  const order = await call('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'Test Address, Dhaka',
      deliveryArea: 'INSIDE_DHAKA',
      paymentMethod: 'COD',
    },
  });

  check('the order is placed successfully',
    order.status === 201 || order.status === 200,
    `${order.status} ${JSON.stringify(order.payload)}`);
  check('the order carries the bought quantity',
    order.payload && order.payload.items &&
      order.payload.items[0].quantity === 2,
    JSON.stringify(order.payload && order.payload.items));

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
