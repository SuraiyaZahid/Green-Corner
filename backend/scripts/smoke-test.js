/**
 * End-to-end smoke test for the Green Corner API.
 * Run with the backend listening on http://localhost:4000
 *
 *   node scripts/smoke-test.js
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
  const { body, token, method = 'GET', expected } = options;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (expected && response.status !== expected) {
    throw new Error(
      `${method} ${path} expected ${expected} got ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return { status: response.status, payload };
}

async function adminToken() {
  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: 'admin@greencorner.bd', password: 'AdminPassword123!' },
    expected: 201,
  });
  return login.payload.accessToken;
}
async function main() {
  console.log(`\nGreen Corner API smoke test → ${API}\n`);

  // Clear residue from any previous interrupted run so counts stay stable.
  const cleanupToken = await adminToken();
  const staleCategories = await call('/admin/categories', {
    token: cleanupToken,
    expected: 200,
  });

  for (const category of staleCategories.payload.filter((c) =>
    c.name.startsWith('Smoke Category'),
  )) {
    const staleProducts = await call(
      `/admin/products?includeArchived=true&limit=100`,
      { token: cleanupToken, expected: 200 },
    );
    for (const product of staleProducts.payload.items.filter(
      (p) => p.categoryId === category.id,
    )) {
      await call(`/admin/products/${product.id}/permanent`, {
        method: 'DELETE',
        token: cleanupToken,
        expected: 200,
      });
    }
    await call(`/admin/categories/${category.id}`, {
      method: 'DELETE',
      token: cleanupToken,
      expected: 200,
    });
  }

  console.log('Catalog');
  const categories = await call('/categories', { expected: 200 });
  check('categories seeded', categories.payload.length > 0, `got ${categories.payload.length}`);
  check(
    'categories include product counts',
    categories.payload.every((c) => c._count && typeof c._count.products === 'number'),
  );

  const products = await call('/products?limit=5', { expected: 200 });
  check('product list returns items', products.payload.items.length === 5);
  check('pagination metadata present', typeof products.payload.totalPages === 'number');

  const filtered = await call('/products?category=seed-packets', { expected: 200 });
  check(
    'category filter works',
    filtered.payload.items.length > 0 &&
      filtered.payload.items.every(
        (p) => p.category.slug === 'seed-packets',
      ),
    `got ${filtered.payload.items.length}`,
  );

  const searched = await call('/products?search=tulsi', { expected: 200 });
  check('search works', searched.payload.items.length === 1, `got ${searched.payload.items.length}`);

  const sorted = await call('/products?sort=price-asc&limit=100', { expected: 200 });
  const prices = sorted.payload.items.map((p) => p.price);
  check('price sort ascending', prices.every((p, i) => i === 0 || prices[i - 1] <= p));

  const featured = await call('/products/featured', { expected: 200 });
  check('featured products returned', featured.payload.length > 0);

  const detail = await call(`/products/${products.payload.items[0].slug}`, { expected: 200 });
  check('product detail by slug', detail.payload.id === products.payload.items[0].id);

  console.log('\nPayment');
  const merchant = await call('/payment/merchant-details', { expected: 200 });
  check('merchant bKash number', merchant.payload.bkashNumber === '01735262232');
  check('merchant Nagad number', merchant.payload.nagadNumber === '01735262232');

  console.log('\nAuth');
  const email = `smoke${Date.now()}@example.com`;
  const registered = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Test', email, password: 'Test@1234' },
    expected: 201,
  });
  check('register returns accessToken', typeof registered.payload.accessToken === 'string');
  check('registered role is USER', registered.payload.user.role === 'USER');

  const token = registered.payload.accessToken;

  const dupe = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Test', email, password: 'Test@1234' },
    expected: 409,
  });
  check('duplicate email rejected', dupe.status === 409);

  const badLogin = await call('/auth/login', {
    method: 'POST',
    body: { email, password: 'wrongpass' },
    expected: 401,
  });
  check('bad password rejected', badLogin.status === 401);

  const login = await call('/auth/login', {
    method: 'POST',
    body: { email, password: 'Test@1234' },
    expected: 201,
  });
  check('login works', typeof login.payload.accessToken === 'string');

  const profile = await call('/auth/profile', { token, expected: 200 });
  check('profile matches email', profile.payload.email === email);

  const unauth = await call('/cart', { expected: 401 });
  check('protected route requires auth', unauth.status === 401);

  console.log('\nCart');
  // The cart and order steps below consume up to 3 units, so pick a product
  // with enough stock rather than blindly taking the first one. The short
  // list from the catalogue check only holds the first page, so look at the
  // full catalogue to be sure a suitable product is there.
  const catalogue = await call('/products?limit=50', { expected: 200 });
  const cartProduct =
    catalogue.payload.items.find((p) => p.stock >= 4) ?? products.payload.items[0];
  const productId = cartProduct.id;
  const add = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId, quantity: 2 },
    expected: 201,
  });
  check('add item to cart', add.payload.items.length === 1);
  check('cart subtotal computed', add.payload.subtotal > 0);

  // Ask for more than the product has in stock, but within the DTO's max of 99.
  const stockNow = (await call(`/products/${cartProduct.slug}`, { expected: 200 })).payload.stock;
  const overStock = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId, quantity: Math.min(99, stockNow + 5) },
    expected: 409,
  });
  check('stock limit enforced', overStock.status === 409);

  const cartItemId = add.payload.items[0].id;
  const updated = await call(`/cart/items/${cartItemId}`, {
    method: 'PATCH',
    token,
    body: { quantity: 3 },
    expected: 200,
  });
  check('update quantity', updated.payload.items[0].quantity === 3);

  console.log('\nOrders');
  const stockBefore = (await call(`/products/${cartProduct.slug}`, { expected: 200 })).payload.stock;

  const noTrx = await call('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'House 12, Road 7, Banani, Dhaka 1213',
      deliveryArea: 'INSIDE_DHAKA',
      paymentMethod: 'BKASH',
      senderNumber: '01735262232',
    },
    expected: 400,
  });
  check('bKash without TrxID rejected', noTrx.status === 400);

  const noSender = await call('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'House 12, Road 7, Banani, Dhaka 1213',
      deliveryArea: 'INSIDE_DHAKA',
      paymentMethod: 'NAGAD',
      trxId: 'TESTTRX123',
    },
    expected: 400,
  });
  check('Nagad without sender number rejected', noSender.status === 400);

  const noArea = await call('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'House 12, Road 7, Banani, Dhaka 1213',
      paymentMethod: 'COD',
    },
    expected: 400,
  });
  check('order without delivery area rejected', noArea.status === 400);

  const codOrder = await call('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'House 12, Road 7, Banani, Dhaka 1213',
      deliveryArea: 'INSIDE_DHAKA',
      paymentMethod: 'COD',
    },
    expected: 201,
  });
  check('COD order created', codOrder.payload.status === 'PENDING');
  check('COD order is UNPAID', codOrder.payload.paymentStatus === 'UNPAID');
  check('COD order has items', codOrder.payload.items.length === 1);
  check(
    'COD order stores the inside-Dhaka delivery fee',
    codOrder.payload.deliveryFee === 80,
    `fee ${codOrder.payload.deliveryFee}`,
  );
  check(
    'order total computed server-side',
    codOrder.payload.totalAmount ===
      cartProduct.price * updated.payload.items[0].quantity + 80,
    `total ${codOrder.payload.totalAmount}`,
  );

  const stockAfter = (await call(`/products/${cartProduct.slug}`, { expected: 200 })).payload.stock;
  check('stock decremented', stockAfter === stockBefore - 3, `${stockBefore} → ${stockAfter}`);

  const cleared = await call('/cart', { token, expected: 200 });
  check('cart cleared after order', cleared.payload.items.length === 0);

  const myOrders = await call('/orders', { token, expected: 200 });
  check('order history shows order', myOrders.payload.length === 1);

  const track = await call(`/orders/${codOrder.payload.id}/track`, { token, expected: 200 });
  check('tracking timeline returned', track.payload.steps.length === 3);

  const cancelled = await call(`/orders/${codOrder.payload.id}/cancel`, {
    method: 'POST',
    token,
    expected: 201,
  });
  check('pending order cancellable', cancelled.payload.status === 'CANCELLED');

  const stockRestored = (await call(`/products/${cartProduct.slug}`, { expected: 200 })).payload.stock;
  check('stock restored on cancel', stockRestored === stockBefore, `${stockAfter} → ${stockRestored}`);

  console.log('\nAdmin');
  const adminLogin = await call('/auth/login', {
    method: 'POST',
    body: { email: 'admin@greencorner.bd', password: 'AdminPassword123!' },
    expected: 201,
  });
  const adminAuthToken = adminLogin.payload.accessToken;
  check('admin can log in', adminLogin.payload.user.role === 'ADMIN');

  const forbidden = await call('/admin/orders', { token, expected: 403 });
  check('customer blocked from admin routes', forbidden.status === 403);

  const adminOrders = await call('/admin/orders', { token: adminAuthToken, expected: 200 });
  check('admin sees all orders', adminOrders.payload.items.length >= 1);

  const stats = await call('/admin/orders/stats', { token: adminAuthToken, expected: 200 });
  check('admin stats endpoint', typeof stats.payload.totalOrders === 'number');

  // Refill the cart — the COD order above consumed it.
  await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId, quantity: 1 },
    expected: 201,
  });

  const bkashOrder = await call('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'House 12, Road 7, Banani, Dhaka 1213',
      deliveryArea: 'OUTSIDE_DHAKA',
      paymentMethod: 'BKASH',
      senderNumber: '01735262232',
      trxId: 'SMOKE-TRX-001',
    },
    expected: 201,
  });
  check('bKash order is VERIFYING', bkashOrder.payload.paymentStatus === 'VERIFYING');
  check('bKash order stores TrxID', bkashOrder.payload.trxId === 'SMOKE-TRX-001');
  check(
    'bKash order stores the outside-Dhaka delivery fee',
    bkashOrder.payload.deliveryFee === 120,
    `fee ${bkashOrder.payload.deliveryFee}`,
  );

  const verified = await call(`/admin/orders/${bkashOrder.payload.id}/payment`, {
    method: 'PATCH',
    token: adminAuthToken,
    body: { paymentStatus: 'PAID' },
    expected: 200,
  });
  check('admin verifies payment', verified.payload.paymentStatus === 'PAID');

  const statusUpdate = await call(`/admin/orders/${bkashOrder.payload.id}/status`, {
    method: 'PATCH',
    token: adminAuthToken,
    body: { status: 'DELIVERED' },
    expected: 200,
  });
  check('admin delivers order', statusUpdate.payload.status === 'DELIVERED');
  check('delivery marks payment PAID', statusUpdate.payload.paymentStatus === 'PAID');

  console.log('\nAdmin CRUD');
  const newCategory = await call('/admin/categories', {
    method: 'POST',
    token: adminAuthToken,
    body: { name: `Smoke Category ${Date.now()}`, description: 'temp' },
    expected: 201,
  });
  check('admin creates category', typeof newCategory.payload.id === 'string');

  const newProduct = await call('/admin/products', {
    method: 'POST',
    token: adminAuthToken,
    body: {
      name: `Smoke Test Plant ${Date.now()}`,
      description: 'A product created by the automated smoke test.',
      price: 199,
      stock: 5,
      categoryId: newCategory.payload.id,
    },
    expected: 201,
  });
  check(
    'admin creates product',
    typeof newProduct.payload.id === 'string' &&
      newProduct.payload.slug.startsWith('smoke-test-plant'),
    newProduct.payload.slug,
  );

  const patched = await call(`/admin/products/${newProduct.payload.id}`, {
    method: 'PATCH',
    token: adminAuthToken,
    body: { price: 249, stock: 9 },
    expected: 200,
  });
  check('admin updates product', patched.payload.price === 249 && patched.payload.stock === 9);

  const archived = await call(`/admin/products/${newProduct.payload.id}`, {
    method: 'DELETE',
    token: adminAuthToken,
    expected: 200,
  });
  check('admin archives product', archived.payload.isArchived === true);

  const notVisible = await call(`/products/${newProduct.payload.slug}`, { expected: 404 });
  check('archived product hidden from store', notVisible.status === 404);

  // A category that still holds products must not be deletable.
  const blockedDelete = await call(`/admin/categories/${newCategory.payload.id}`, {
    method: 'DELETE',
    token: adminAuthToken,
    expected: 409,
  });
  check('category with products cannot be deleted', blockedDelete.status === 409);

  await call(`/admin/products/${newProduct.payload.id}/permanent`, {
    method: 'DELETE',
    token: adminAuthToken,
    expected: 200,
  });
  check('admin permanently deletes unreferenced product', true);

  await call(`/admin/categories/${newCategory.payload.id}`, {
    method: 'DELETE',
    token: adminAuthToken,
    expected: 200,
  });
  check('admin deletes empty category', true);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error.message);
  process.exit(1);
});
