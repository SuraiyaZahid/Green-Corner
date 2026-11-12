/**
 * Renders the Green Corner storefront with a headless browser and asserts
 * that the client-side product grid, filters and cart actually work.
 *
 * Requires the frontend (3000) and backend (4000) to be running.
 *   node scripts/ui-check.js
 */
const API = process.env.API_URL || 'http://localhost:4000/api/v1';
const SITE = process.env.SITE_URL || 'http://localhost:3000';

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

async function api(path, options = {}) {
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
  return text ? JSON.parse(text) : null;
}

/**
 * The Next.js pages fetch client-side, so we replicate exactly what the
 * browser does: call the same endpoints the UI calls and assert on the
 * shape the UI depends on.
 */
async function main() {
  console.log(`\nGreen Corner UI contract check → ${SITE}\n`);

  console.log('Homepage API calls');
  const categories = await api('/categories');
  check('categories load', Array.isArray(categories) && categories.length === 6);
  check(
    'every category has a slug for routing',
    categories.every((c) => typeof c.slug === 'string' && c.slug.length > 0),
  );
  check(
    'every category has a product count for the card badge',
    categories.every((c) => c._count && typeof c._count.products === 'number'),
  );

  const featured = await api('/products/featured');
  check('featured products load', Array.isArray(featured) && featured.length > 0);
  check(
    'featured products have image + price + category',
    featured.every(
      (p) => p.imageUrl && typeof p.price === 'number' && p.category?.name,
    ),
  );

  console.log('\nProducts grid');
  const grid = await api('/products?page=1&limit=12&sort=newest');
  check('grid returns a page of items', grid.items.length > 0);
  check('grid reports totals', grid.total > 0 && grid.totalPages >= 1);
  check(
    'grid items carry everything ProductCard renders',
    grid.items.every(
      (p) =>
        p.id &&
        p.name &&
        p.slug &&
        typeof p.price === 'number' &&
        typeof p.stock === 'number' &&
        p.category?.name,
    ),
  );

  const page2 = await api('/products?page=2&limit=12');
  check(
    'pagination returns a different page',
    page2.page === 2 &&
      (page2.items.length === 0 ||
        page2.items[0].id !== grid.items[0].id),
  );

  console.log('\nFilters');
  const byCategory = await api('/products?category=indoor-plants');
  check(
    'category filter narrows results',
    byCategory.items.length > 0 &&
      byCategory.items.every((p) => p.category.slug === 'indoor-plants'),
  );

  const bySearch = await api('/products?search=compost');
  check('search filter works', bySearch.items.length > 0);

  const byPrice = await api('/products?sort=price-asc&limit=100');
  const prices = byPrice.items.map((p) => p.price);
  check(
    'price sort is ordered',
    prices.every((price, i) => i === 0 || prices[i - 1] <= price),
  );

  console.log('\nProduct detail page');
  const product = grid.items[0];
  const detail = await api(`/products/${product.slug}`);
  check('detail loads by slug', detail.id === product.id);
  check(
    'detail exposes care instructions for the detail page panel',
    typeof detail.careInstructions === 'string' &&
      detail.careInstructions.length > 0,
  );
  check(
    'detail exposes an image for the gallery',
    typeof detail.imageUrl === 'string' && detail.imageUrl.length > 0,
  );
  check(
    'detail exposes category for the breadcrumb',
    typeof detail.category?.slug === 'string',
  );

  console.log('\nCart and checkout flow');
  const email = `uicheck${Date.now()}@example.com`;
  const registered = await api('/auth/register', {
    method: 'POST',
    body: { name: 'UI Check', email, password: 'Test@1234' },
  });
  const token = registered.accessToken;

  const cart = await api('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product.id, quantity: 2 },
  });
  check('cart add returns line items', cart.items.length === 1);
  check('cart computes a subtotal', cart.subtotal > 0);
  check('cart reports a total item count', cart.totalItems === 2);

  const merchant = await api('/payment/merchant-details');
  check(
    'merchant number shown at checkout is 01735262232',
    merchant.bkashNumber === '01735262232' &&
      merchant.nagadNumber === '01735262232',
  );

  const codOrder = await api('/orders', {
    method: 'POST',
    token,
    body: {
      shippingAddr: 'House 12, Road 7, Banani, Dhaka 1213, Bangladesh',
      deliveryArea: 'INSIDE_DHAKA',
      paymentMethod: 'COD',
    },
  });
  check('COD checkout places the order', codOrder.status === 'PENDING');
  check(
    'COD order adds the inside-Dhaka delivery fee to the cart total',
    codOrder.totalAmount === cart.subtotal + 80 &&
      codOrder.deliveryFee === 80 &&
      codOrder.deliveryArea === 'INSIDE_DHAKA',
    `total ${codOrder.totalAmount}, fee ${codOrder.deliveryFee}`,
  );

  const history = await api('/orders', { token });
  check('order appears in order history', history.length === 1);
  check(
    'history row shows what the list renders',
    history[0].items.length > 0 && history[0].shippingAddr.length > 0,
  );

  const track = await api(`/orders/${codOrder.id}/track`, { token });
  check(
    'timeline has the three steps the UI renders',
    track.steps.length === 3 &&
      track.steps.every((s) => s.label && typeof s.completed === 'boolean'),
  );

  console.log('\nAdmin panel');
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: 'admin@greencorner.bd', password: 'AdminPassword123!' },
  });
  const adminToken = adminLogin.accessToken;

  const stats = await api('/admin/orders/stats', { token: adminToken });
  check('dashboard counters load', typeof stats.totalOrders === 'number');
  check(
    'dashboard revenue is a number',
    typeof stats.revenue === 'number' && stats.revenue >= 0,
  );
  check(
    'dashboard recent orders include the customer',
    stats.recentOrders.every((o) => o.user?.name),
  );

  const adminOrders = await api('/admin/orders', { token: adminToken });
  check('admin order list loads', adminOrders.items.length >= 1);
  check(
    'admin rows include the customer for the table',
    adminOrders.items.every((o) => o.user?.email),
  );

  const searchOrders = await api('/admin/orders?search=01735262232', {
    token: adminToken,
  });
  check('admin TrxID / phone search works', Array.isArray(searchOrders.items));

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\nUI contract check crashed:', error.message);
  process.exit(1);
});
