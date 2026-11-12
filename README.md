# Green Corner

**Green Corner** is a full-stack e-commerce platform for plant enthusiasts in
Bangladesh — indoor and outdoor plants, organic compost and fertiliser
(*Joibo Sar*), gardening equipment, seed packets and pots (*Tob*).

Built to the specifications in [`green_corner_prd_srs.md`](./green_corner_prd_srs.md).

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14 (App Router, TypeScript), Tailwind CSS |
| Backend | NestJS 10 (TypeScript, modular MVC), Prisma ORM, JWT auth |
| Database | PostgreSQL — local Docker/Postgres in dev, Neon Serverless in production |
| Deployment | Vercel (frontend + serverless API) |

---

## Features

### Storefront
- Six categories exactly as specified in the PRD: Indoor Plants, Outdoor Plants,
  Compost & Fertilizers, Gardening Equipment, Seed Packets, Pots & Planters.
- Product listing with category filter, text search, sorting (price, name,
  newest) and pagination.
- Product detail pages with gallery, price, live stock badge, description and
  care instructions.
- Cart with quantity editing and live stock validation — server-authoritative
  pricing, so the client can never set its own total.
- Checkout with three payment methods:
  - **Cash on Delivery** — order is created as `UNPAID`.
  - **bKash** and **Nagad** — manual transfer to `01735262232`; the customer
    must submit their sender mobile number and the TrxID. The order is created
    as `VERIFYING` and waits for admin verification.
- Universal footer with the corporate phone `01735262232`, email
  `suraiyazahid085@gmail.com` and the Kuril Bisso Road, Dhaka address.

### Accounts
- Registration and login with bcrypt-hashed passwords and JWT bearer tokens
  (7-day expiry).
- Profile view/edit: name, mobile number and password change.
- Order history with a delivery status timeline, plus self-service cancellation
  while an order is still `PENDING` (stock is restored automatically).

### Admin panel
- Dashboard with order counters by status, orders awaiting payment
  verification, revenue, product/category counts and low-stock alerts.
- Product CRUD with image upload (JPG/PNG/WEBP/GIF, 2 MB max).
- Category CRUD, blocked from deleting a category that still holds products.
- Order management with status transitions (`PENDING` → `PROCESSING` →
  `DELIVERED`, or `CANCELLED`) and manual TrxID verification.
- bKash/Nagad verification panel showing the submitted TrxID, sender number and
  amount due side by side with the merchant number.

---

## Project structure

```
green-corner/
├── docker-compose.yml            # local PostgreSQL 16
├── package.json                  # npm workspaces + shared scripts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # data model
│   │   └── seed.ts               # admin, customer, 6 categories, 28 products
│   ├── scripts/
│   │   ├── setup-db.js           # creates the role and database
│   │   ├── smoke-test.js         # 51 API end-to-end assertions
│   │   └── cleanup-test-data.js  # removes smoke-test residue
│   └── src/
│       ├── auth/                 # register, login, JWT strategy, profile
│       ├── users/                # (folded into auth)
│       ├── categories/           # public list + CRUD
│       ├── products/             # public browse + CRUD
│       ├── cart/                 # server-side cart with stock checks
│       ├── orders/               # checkout, history, tracking, cancel
│       ├── admin/                # admin order/product/category controllers
│       ├── payment/              # merchant details endpoint
│       ├── upload/               # image upload
│       ├── common/               # guards, decorators, exception filter
│       └── prisma/               # PrismaService
└── frontend/
    ├── app/
    │   ├── page.tsx              # home
    │   ├── products/             # listing + [slug] detail
    │   ├── category/[slug]/      # category listing
    │   ├── cart/  checkout/      # cart and checkout
    │   ├── login/  register/     # auth
    │   ├── account/              # profile + order history
    │   └── admin/                # dashboard, products, categories, orders
    ├── components/               # Header, Footer, ProductCard, forms…
    ├── lib/                      # api client, types, auth + cart contexts
    └── scripts/ui-check.js       # 31 UI contract assertions
```

---

## Getting started

### Prerequisites
- Node.js 18.18+ (tested on Node 24)
- PostgreSQL 15+ — either via Docker, a local install, or [Neon](https://neon.tech)

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

**With Docker:**

```bash
docker compose up -d
```

**Without Docker** — point `DATABASE_URL` at any running PostgreSQL and create
the role and database:

```bash
npm run db:setup
```

<details>
<summary>Installing PostgreSQL on Windows without Docker</summary>

```powershell
winget install --id PostgreSQL.PostgreSQL.16 --silent `
  --override "--mode unattended --unattendedmodeui none --superpassword green_corner --servicename postgresql-x64-16 --serverport 5432"
```

Then run `npm run db:setup` to create the `green_corner` role and database.
</details>

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env`:

```env
DATABASE_URL="postgresql://green_corner:green_corner@localhost:5432/green_corner?schema=public"
JWT_SECRET="change-me-to-a-long-random-string"
PORT=4000
FRONTEND_URL="http://localhost:3000"
UPLOAD_DIR="uploads"
```

`frontend/.env`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

### 4. Create the schema and seed the data

```bash
npm run db:migrate   # applies prisma/migrations and generates the client
npm run db:seed      # admin, customer, 6 categories, 28 products
```

### 5. Run both apps

```bash
npm run dev
```

- Storefront → http://localhost:3000
- REST API → http://localhost:4000/api/v1
- Swagger UI → http://localhost:4000/api/docs

### Accounts

The **Admin** account is fixed and is created automatically whenever the API
boots — it is repaired if it is missing, has the wrong password, or lost the
`ADMIN` role. No manual seeding step is required.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@greencorner.bd` | `AdminPassword123!` |
| Customer | `customer@example.com` | `Customer@123` |

Regular customers have **no fixed account**. Anyone can register at
`/register` and sign in at `/login`; self-registered accounts always receive
the `USER` role.

> Change the admin password before deploying to production.

### Roles and access control

| Area | Access |
| --- | --- |
| `/api/v1/admin/*` | `ADMIN` only — `JwtAuthGuard` + `RolesGuard` |
| `/admin` (frontend) | `ADMIN` only — otherwise redirected to `/admin/access-denied` |
| `/admin/*` while signed out | Redirected to `/login` |
| `/cart`, `/orders`, `/account` | Any signed-in user (scoped to their own data) |
| `/products`, `/categories`, `/payment/merchant-details` | Public |

---

## Testing

With both servers running:

```bash
npm run test:api   # 51 assertions across auth, catalog, cart, orders, admin
npm run test:ui    # 31 assertions covering the storefront and admin panels
```

Both suites are idempotent — `test:api` cleans up its own residue before and
after each run. If a run is interrupted, `npm run db:cleanup-test` removes
any leftover test categories and products.

---

## API reference

All routes are prefixed with `/api/v1`. Protected routes require an
`Authorization: Bearer <token>` header.

### Public

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/categories` | All categories with product counts |
| `GET` | `/products` | Browse — `?category=&search=&sort=&page=&limit=` |
| `GET` | `/products/featured` | Featured products for the homepage |
| `GET` | `/products/:slug` | Single product with category |
| `GET` | `/payment/merchant-details` | bKash/Nagad merchant numbers |
| `POST` | `/auth/register` | Create an account, returns a JWT |
| `POST` | `/auth/login` | Sign in, returns a JWT |

### Customer

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/auth/profile` | Current user profile |
| `PATCH` | `/auth/profile` | Update name, phone or password |
| `GET` | `/cart` | Server-side cart |
| `POST` | `/cart/items` | Add a product `{ productId, quantity }` |
| `PATCH` | `/cart/items/:id` | Change quantity `{ quantity }` |
| `DELETE` | `/cart/items/:id` | Remove a line |
| `DELETE` | `/cart` | Empty the cart |
| `POST` | `/orders` | Place an order from the cart |
| `GET` | `/orders` | Order history |
| `GET` | `/orders/:id` | Order detail |
| `GET` | `/orders/:id/track` | Delivery status timeline |
| `POST` | `/orders/:id/cancel` | Cancel a pending order |

### Admin

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/admin/orders` | All orders — `?status=&paymentStatus=&search=` |
| `GET` | `/admin/orders/stats` | Dashboard counters |
| `GET` | `/admin/orders/:id` | Order detail for verification |
| `PATCH` | `/admin/orders/:id/status` | Update status `{ status }` |
| `PATCH` | `/admin/orders/:id/payment` | Verify payment `{ paymentStatus }` |
| `GET` | `/admin/products` | Products including archived |
| `POST` | `/admin/products` | Create a product |
| `PATCH` | `/admin/products/:id` | Update a product |
| `DELETE` | `/admin/products/:id` | Archive a product |
| `DELETE` | `/admin/products/:id/permanent` | Permanently delete (no orders) |
| `POST` | `/admin/products/:id/restore` | Restore an archived product |
| `GET` | `/admin/categories` | All categories |
| `POST` | `/admin/categories` | Create a category |
| `PATCH` | `/admin/categories/:id` | Update a category |
| `DELETE` | `/admin/categories/:id` | Delete an empty category |
| `POST` | `/admin/upload` | Upload a product image (`multipart/form-data`) |

### Placing a bKash or Nagad order

`POST /orders` requires `shippingAddr` and `paymentMethod`. For `BKASH` and
`NAGAD` it also requires `senderNumber` (the mobile number you sent from) and
`trxId` (the transaction ID) — the request is rejected with `400` if either is
missing.

```json
{
  "shippingAddr": "House 12, Road 7, Banani, Dhaka 1213, Bangladesh",
  "paymentMethod": "BKASH",
  "senderNumber": "01735262232",
  "trxId": "8H2K4L9MNP"
}
```

Order totals are always recomputed from database prices, and stock is
decremented inside the same transaction that creates the order.

---

## Deployment

### Database (Neon)

1. Create a database at [neon.tech](https://neon.tech).
2. Copy the connection string into `backend/.env`:

   ```env
   DATABASE_URL="postgresql://user:password@ep-cool-db.neon.tech/green_corner?sslmode=require"
   ```

3. Apply the migrations:

   ```bash
   npm run prisma:deploy -w backend
   ```

### Vercel

The backend needs to run as a serverless function. Add a `vercel.json` to
`backend/` that points at the compiled NestJS entrypoint:

```json
{
  "version": 2,
  "builds": [{ "src": "dist/main.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "dist/main.js" }]
}
```

Then deploy both apps:

```bash
cd backend  && vercel --prod
cd frontend && vercel --prod
```

Set these environment variables in Vercel:

- **Backend**: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (your storefront
  domain), `UPLOAD_DIR`.
- **Frontend**: `NEXT_PUBLIC_API_URL` (your backend's `/api/v1` URL).

> Uploaded images are written to the local filesystem. On Vercel the container
> filesystem is ephemeral — point `UPLOAD_DIR` at a durable store (S3, Vercel
> Blob, Cloudinary) or store image URLs in the database and serve them from
> your CDN.

---

## Notes and limitations

- **Manual mobile payments.** As specified in the SRS, bKash and Nagad are
  handled by manual transfer with admin-side TrxID verification, not by a
  payment gateway API.
- **Soft-deleted products.** `DELETE /admin/products/:id` archives a product
  rather than deleting it, so historic order items keep a valid reference.
  Permanent deletion is available via `/permanent` for products that have
  never been ordered.
- **Prices are stored as `Float`** in BDT, following the schema in the SRS.
  For production accounting, `Decimal` would be the safer choice.
- **Out of scope:** SMS/email notifications, product reviews and ratings,
  coupons, multi-vendor support, email verification and password reset.

---

## Contact

Green Corner — Kuril Bisso Road, Dhaka, Bangladesh

- **Phone:** 01735262232
- **Email:** suraiyazahid085@gmail.com
