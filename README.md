<div align="center">

# 🛒 PulseMarket

**A full-stack mobile marketplace** — React Native (Expo) app, Node.js/Express REST API,
PostgreSQL database, JWT auth with refresh-token rotation, Redis caching —
built with a CI/CD, containerisation, monitoring and scaling mindset.

`Mobile` · `Backend` · `PostgreSQL` · `Redis` · `Docker` · `CI/CD` · `Monitoring`

</div>

---

## 📖 Overview

PulseMarket is a marketplace application: buyers can **discover products**,
manage a **cart**, pay with **Stripe-hosted checkout** or cash on delivery, and
follow order status and shipment tracking. Sellers can manage listings, sales,
inventory and fulfillment; administrators can review accounts, moderate
listings and inspect audit and sales activity. The project is deliberately built as a
*DevOps portfolio piece*: every layer (database → API → mobile app → container →
pipeline → observability) is designed to be deployed and monitored, not just
demoed on `localhost`.

> **Status:** Phases 1–6 complete (Database + Backend + Mobile).
> Containerisation (Docker), CI/CD, deployment, monitoring and scaling follow.

---

## 🏗️ Architecture

```
                 ┌──────────────────────┐
                 │   React Native app   │   Expo · expo-router · TypeScript
                 │   (iOS / Android)    │   Zustand · SecureStore
                 └───────────┬──────────┘
                             │ HTTPS / JSON
                             ▼
                 ┌──────────────────────┐
                 │   Express REST API   │   Node.js 22 · JWT · Zod validation
                 │      :5000           │   Helmet · CORS · rate limiting
                 └───────┬───────┬──────┘
                         │       │
              ┌──────────▼─┐   ┌─▼────────────┐
              │ PostgreSQL │   │   Redis      │
              │ (primary)  │   │  (cache)     │
              └────────────┘   └──────────────┘

  Observability (available now, wired up in the monitoring phase):
      /health   liveness        /ready   readiness        /metrics   Prometheus
```

---

## ✨ Features

**Mobile**
- Animated onboarding → login / register flow
- Home feed with category chips, search bar and trending products
- Dedicated product discovery with autocomplete, stock/price filters, sorting, pagination and recent searches
- Product details with multi-image gallery, verified-buyer reviews and seller replies
- Favorites with wishlist sharing and configurable price-drop alerts
- Cart with selected-currency formatting, quantity steppers, live totals and a confirmed clear-cart action
- Stripe-hosted card checkout (no card data collected by PulseMarket), cash-on-delivery, and buyer shipment/status history
- Notification center with unread count badge on the Home tab
- Settings for currency, language, delivery defaults, and notification preferences
- Seller workspace with buyer/shipping details, fulfillment actions, sales analytics, low-stock alerts and best sellers
- Admin workspace with account/seller search and review, role/suspension controls, listing moderation, trends and audit history
- Profile, secure session persistence, immediate local logout, and account-scoped state cleanup
- Access tokens stored in the OS keychain, silent refresh on 401

**Backend**
- REST API with a consistent `{ success, data }` envelope
- JWT auth: short-lived **access** token + **rotating refresh** tokens
- Refresh tokens stored **hashed** (SHA-256) and revocable on logout
- Role-based access control (`user`, `seller`, `admin`)
- Authenticated user-settings API with per-user persisted preferences
- Notifications API with mark-read and mark-all-read actions
- Role-protected seller fulfillment, analytics and administrator account/audit APIs
- Stripe Checkout sessions and signature-verified webhooks; Cloudinary-backed validated product image uploads
- Verified-purchase reviews, order status history, wishlist sharing and price-alert notifications
- Zod request validation, centralised error handling, structured logs
- Helmet, CORS, compression, global + auth-specific rate limiting
- Transactional order creation and stock decrement with row-level locks; seller fulfillment is tracked per seller in multi-seller orders
- Graceful degradation when Redis is unavailable
- Health, readiness and Prometheus-format metrics endpoints

**Database**
- Idempotent schema migrations with payment state, product images, reviews, shipment history, per-seller fulfillment, audit logs, price alerts and expiring wishlist-share tokens
- Auto `updated_at` triggers
- Idempotent migration, including a safe `orders.payment_method` backfill for existing databases, seed data and a verification script

---

## 🧰 Tech Stack

| Layer            | Technology                                   |
|------------------|----------------------------------------------|
| Mobile           | React Native, Expo, expo-router, TypeScript  |
| State / storage  | Zustand, expo-secure-store                   |
| Backend          | Node.js 22, Express 4                        |
| Auth             | JSON Web Tokens (access + rotating refresh)  |
| Validation       | Zod                                          |
| Payments         | Stripe Checkout + signed webhooks            |
| Image storage    | Cloudinary                                    |
| Database         | PostgreSQL 16                                |
| Cache            | Redis 7                                      |
| Containerisation | Docker, Docker Compose                       |
| CI               | GitHub Actions                               |

---

## 📂 Project structure

```
PulseMarket/
├── mobile/                     # React Native + Expo (TypeScript)
│   ├── app/                    # expo-router screens
│   │   ├── _layout.tsx         # root layout + auth guard
│   │   ├── onboarding.tsx  login.tsx  register.tsx
│   │   ├── (tabs)/             # home · search · favorites · cart · profile
│   │   ├── product/[id].tsx
│   │   ├── checkout.tsx  orders.tsx  notifications.tsx  settings.tsx
│   ├── components/             # Button, Input, ProductCard, ...
│   ├── services/               # api client + resource services
│   ├── store/                  # Zustand stores (auth, cart, favorites)
│   ├── hooks/  constants/  types/
│   └── app.json  package.json  tsconfig.json
│
├── backend/                    # Node.js + Express REST API
│   ├── src/
│   │   ├── config/             # env, db pool, redis, logger, metrics
│   │   ├── controllers/        # HTTP layer
│   │   ├── services/           # business logic
│   │   ├── repositories/       # SQL / data access
│   │   ├── models/             # row -> API mappers
│   │   ├── routes/             # route definitions
│   │   ├── middleware/         # auth, validation, errors, rate limiting
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # jwt, password, pagination, ApiError
│   │   ├── scripts/            # migrate.js, seed.js
│   │   ├── app.js  server.js
│   ├── tests/                  # Jest + Supertest
│   └── Dockerfile  package.json
│
├── database/                   # Plain-SQL schema & data
│   ├── 00_create_database.sql
│   ├── 01_migration.sql
│   ├── 04_marketplace_expansion.sql
│   ├── 02_seed.sql
│   └── 03_verify.sql
│
├── infrastructure/             # nginx / deploy assets (Docker phase)
├── monitoring/                 # Prometheus · Grafana · Loki (later phase)
├── load-tests/                 # k6 scripts (later phase)
├── .github/workflows/ci.yml    # lint + tests + typecheck
├── docker-compose.yml          # api + postgres + redis
└── README.md
```

---

## 🚀 Quick start

### Prerequisites

- **Node.js 20+** (22 recommended) and npm
- **PostgreSQL 14+** running locally
- **Redis** (optional in development)
- **Expo Go** on your phone, or an Android/iOS emulator
- **Stripe test keys** to exercise card checkout; **Cloudinary credentials** to test image uploads

### 1 · Backend

```bash
cd backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run db:setup              # creates the DB, applies the schema, seeds data
npm run dev                   # -> http://localhost:5000
```

Copy the optional integration settings in `backend/.env.example` into
`backend/.env`. Stripe card payments are charged in USD. For local webhook
testing, run `stripe listen --forward-to localhost:5000/api/payments/webhook`
and copy the generated signing secret to `STRIPE_WEBHOOK_SECRET`. Set
`STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` to your app's deep-link or
universal-link URLs; use HTTPS universal links for production. Configure all
three Cloudinary values to enable product image uploads.

Verify:

```bash
curl http://localhost:5000/health
# { "status":"ok", "service":"pulsemarket-api", ... }
```

### 2 · Mobile

```bash
cd mobile
npm install --legacy-peer-deps
cp .env.example .env          # set EXPO_PUBLIC_API_URL for your target
npx expo start -c
```

Set `EXPO_PUBLIC_APP_URL` to a public HTTPS app URL if shared wishlists should
open in a browser; otherwise the app generates an Expo deep link. The currency
setting changes display formatting only; it does not convert stored USD prices.

Then press `a` (Android emulator), `i` (iOS simulator) or scan the QR code with
**Expo Go**.

> **API URL cheat-sheet**
> | Target            | `EXPO_PUBLIC_API_URL`            |
> |-------------------|----------------------------------|
> | Android emulator  | `http://10.0.2.2:5000`           |
> | iOS simulator     | `http://localhost:5000`          |
> | Physical phone    | `http://<your-PC-LAN-IP>:5000`   |

### 3 · Demo accounts

Seeded by `npm run seed` — password for all: **`Password123!`**

| Role   | Email                     |
|--------|---------------------------|
| Buyer  | `buyer@pulsemarket.dev`   |
| Seller | `seller@pulsemarket.dev`  |
| Admin  | `admin@pulsemarket.dev`   |

---

## 🐘 Database setup (manual alternative)

If you prefer running the SQL yourself (pgAdmin / `psql`):

1. **Create the database** — connect to the `postgres` database and run
   `database/00_create_database.sql`.
2. **Create the tables** — connect to **`pulsemarket`** and run
   `database/01_migration.sql`.
3. **Apply the marketplace expansion** — run `database/04_marketplace_expansion.sql`.
4. **Load demo data** — run `database/02_seed.sql`.
5. **Verify** — run `database/03_verify.sql` (prints row counts + the catalog).

The equivalent one-liners are `npm run migrate`, `npm run seed`,
`npm run db:setup`.

---

## 📡 API reference

Base URL: `http://localhost:5000` · All responses use
`{ "success": boolean, "data": ... }` (errors use `error: { message, details }`).

| Method | Endpoint                  | Auth        | Description                    |
|--------|---------------------------|-------------|--------------------------------|
| GET    | `/health`                 | –           | Liveness probe                 |
| GET    | `/ready`                  | –           | Readiness (DB + Redis)         |
| GET    | `/metrics`                | –           | Prometheus metrics             |
| POST   | `/api/auth/register`      | –           | Create an account              |
| POST   | `/api/auth/login`         | –           | Login → tokens                 |
| POST   | `/api/auth/refresh`       | –           | Rotate refresh token           |
| POST   | `/api/auth/logout`        | bearer      | Revoke refresh token           |
| GET    | `/api/auth/me`            | bearer      | Current user                   |
| PATCH  | `/api/auth/profile`       | bearer      | Update profile name/avatar     |
| POST   | `/api/auth/change-password`| bearer     | Change password                |
| GET    | `/api/settings`            | bearer      | Get current user's preferences |
| PATCH  | `/api/settings`            | bearer      | Update currency, language, notification and delivery preferences |
| GET    | `/api/products`           | optional    | List/search (`q`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`) |
| GET    | `/api/products/suggest?q=`| –           | Search autocomplete suggestions |
| GET    | `/api/products/mine`      | seller/admin| List my listings, including hidden listings |
| GET    | `/api/products/:id`       | –           | Product detail                 |
| POST   | `/api/products`           | seller      | Create product                 |
| PUT    | `/api/products/:id`       | seller/owner| Update product                 |
| DELETE | `/api/products/:id`       | seller/owner| Delete product                 |
| POST   | `/api/products/:id/images`| seller/owner| Upload up to 6 validated images (5 MB each) |
| DELETE | `/api/products/:id/images/:imageId` | seller/owner | Remove an uploaded image |
| GET    | `/api/products/:id/reviews` | –         | List product reviews and rating aggregate |
| GET    | `/api/products/:id/reviews/eligible-items` | bearer | Find completed paid purchase lines eligible for review |
| POST   | `/api/products/:id/reviews` | bearer     | Submit a verified-purchase review |
| PATCH  | `/api/reviews/:reviewId/response` | seller | Reply to a review on your listing |
| GET    | `/api/categories`         | –           | Categories (`?withCounts=true`)|
| GET    | `/api/favorites`          | bearer      | My favorites                   |
| POST   | `/api/favorites`          | bearer      | Add favorite                   |
| DELETE | `/api/favorites/:id`      | bearer      | Remove favorite                |
| GET    | `/api/cart`               | bearer      | Get cart                       |
| POST   | `/api/cart`               | bearer      | Add to cart                    |
| PUT    | `/api/cart/:productId`    | bearer      | Change quantity                |
| DELETE | `/api/cart/:productId`    | bearer      | Remove line                    |
| DELETE | `/api/cart`               | bearer      | Clear the cart                 |
| POST   | `/api/orders`             | bearer      | Place a cash-on-delivery order (from cart) |
| GET    | `/api/orders`             | bearer      | My orders (with items)         |
| GET    | `/api/orders/:id`         | bearer      | Order detail, status history and shipment tracking |
| POST   | `/api/payments/checkout-session` | bearer | Create a Stripe-hosted card checkout |
| GET    | `/api/payments/sessions/:sessionId` | bearer | Check payment-session status |
| POST   | `/api/payments/webhook`    | Stripe      | Verify payment/expiry events and update orders |
| GET    | `/api/notifications`      | bearer      | List notifications             |
| PATCH  | `/api/notifications/:id/read` | bearer   | Mark a notification as read    |
| POST   | `/api/notifications/read-all` | bearer   | Mark all notifications read    |
| GET    | `/api/wishlist/shared/:token` | –         | Read an unexpired shared wishlist |
| POST   | `/api/wishlist/share`      | bearer      | Create a 30-day wishlist share link |
| GET    | `/api/wishlist/price-alerts` | bearer     | List active price alerts |
| POST   | `/api/wishlist/price-alerts/:productId` | bearer | Set/update a price-drop target |
| DELETE | `/api/wishlist/price-alerts/:productId` | bearer | Remove a price alert |
| GET    | `/api/seller/orders`        | approved seller | List orders containing your products |
| PATCH  | `/api/seller/orders/:id/fulfillment` | approved seller | Update tracking and shipment status |
| GET    | `/api/seller/analytics`     | approved seller | Sales, revenue, low stock and best sellers |
| GET    | `/api/admin/summary`        | admin       | Marketplace users, listings, orders and paid sales |
| GET    | `/api/admin/trends`         | admin       | Daily order, cancellation, revenue and seller trends |
| GET    | `/api/admin/users?q=`       | admin       | Search users and seller accounts |
| PATCH  | `/api/admin/users/:id`      | admin       | Change role/seller review status or suspend/reactivate |
| GET    | `/api/admin/audit`          | admin       | Read administrator action history |
| GET    | `/api/admin/products`       | admin       | List all listings for moderation |
| PATCH  | `/api/admin/products/:id`   | admin       | Update a listing, including visibility |
| GET    | `/api/admin/orders`         | admin       | Browse marketplace orders (fulfillment remains seller-managed) |

`PATCH /api/settings` accepts any non-empty subset of `currency` (`USD`, `EUR`,
`TND`, `GBP`), `language` (`en`, `fr`, `ar`), `pushNotifications`,
`emailNotifications`, `smsNotifications`, `defaultAddress`, and `phone`.
Settings are private to the authenticated user; omitted fields remain unchanged.

Card payments must use the hosted Stripe session endpoint; selecting `card` on
the direct orders endpoint is rejected. Order status/payment state is updated by
Stripe webhooks and seller fulfillment, not by a client-selected payment method.
Seller order and product routes are owner-scoped and require administrator
approval. New and pre-existing seller accounts start in the `pending` review
state (the demo seller is seeded as approved); approve them in the Admin
workspace before they can publish listings or fulfill orders. Admin account
changes are written to `admin_audit_logs`.

<details>
<summary><b>Example session (curl)</b></summary>

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@pulsemarket.dev","password":"Password123!"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).data.accessToken")

# Browse
curl -s "http://localhost:5000/api/products?q=headphones&sort=price_asc"

# Add to cart
curl -s -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":2,"quantity":1}'

# Checkout
curl -s -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shippingAddress":"12 Avenue Habib Bourguiba, Tunis"}'
```
</details>

---

## 🔐 Security notes

- Passwords hashed with **bcrypt** (10 rounds).
- Refresh tokens are **stored hashed**, rotated on every use, and revoked on logout.
- Access tokens are short-lived (15 min) and sent via the `Authorization` header.
- **Helmet**, **CORS**, request **rate limiting** and strict **Zod validation** on input.
- Stripe webhook signatures are verified against the raw request body; card data is handled by Stripe Checkout.
- All SQL is parameterised (`$1, $2, …`) — no string concatenation of user input.
- Secrets live in `.env` (git-ignored); `.env.example` documents every key.

---

## 🧪 Testing & quality

```bash
cd backend
npm run lint      # ESLint
npm test          # Jest + Supertest (health, metrics, validation, auth guards)
npm run migrate   # apply schema           ┐
npm run seed      # load demo data         ├ DB is set up with these
```

The API was verified end-to-end against a real PostgreSQL instance:
login → list/search products → favorites → cart → checkout (stock decremented,
cart cleared) → refresh-token rotation (old token revoked) → registration — 17/17
checks passed.

On the mobile side, run `cd mobile; npm run typecheck`. Backend checks are
`cd backend; npm run lint` and `npm test`. Applying migrations and end-to-end
payment/image tests requires a configured PostgreSQL database, Stripe test
credentials/webhook secret and Cloudinary account.

---

## 🗺️ Roadmap

| Phase | Scope                                                       | Status |
|-------|-------------------------------------------------------------|--------|
| 1     | Project setup, Git, GitHub                                   | ✅ |
| 2     | Mobile UI (onboarding, home, search, product, favorites, cart)| ✅ |
| 3     | Express backend + REST API                                   | ✅ |
| 4     | PostgreSQL schema, migration & seed                          | ✅ |
| 5     | Authentication (JWT + refresh rotation)                      | ✅ |
| 6     | Products, cart, orders, favorites                            | ✅ |
| 7     | **Docker + Docker Compose**                                  | ⏭️ next |
| 8     | GitHub Actions CI                                            | 🟡 base workflow included |
| 9     | Container registry (GHCR)                                    | ⏳ |
| 10    | Cloud deployment (Render / Oracle Cloud)                     | ⏳ |
| 11    | HTTPS + Nginx reverse proxy                                  | ⏳ |
| 12-14 | Prometheus · Grafana · Loki                                  | ⏳ |
| 15-16 | k6 load testing · horizontal scaling                         | ⏳ |
| 17    | Mobile CI/CD (EAS Build)                                     | ⏳ |

**Next phase (Docker):** `docker compose up -d --build`, then
`docker compose exec api npm run db:setup`, then point the mobile app at the
container and add `docker.yml` / `deploy.yml` workflows.

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `database NOT reachable` on start | Check PostgreSQL is running and `.env` credentials match. |
| Mobile can't reach the API | Start the backend and confirm `http://localhost:5000/health` responds on your PC. Android emulator: use `http://10.0.2.2:5000`; iOS simulator: `http://localhost:5000`; physical phone: set `EXPO_PUBLIC_API_URL` in `mobile/.env` to `http://<your-PC-LAN-IP>:5000` and keep both devices on the same Wi‑Fi. Restart Expo with `npx expo start -c` after changing `.env`. |
| `relation "users" does not exist` | Run `npm run migrate` (or the SQL files) first. |
| Redis warnings in the logs | Expected — Redis is optional in development. |
| Expo dependency warnings | `npx expo install --fix`. |

---

<div align="center">
<sub>Built as a portfolio project covering Mobile · Backend · Database · DevOps.</sub>
</div>
