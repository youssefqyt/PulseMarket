<div align="center">

# 🛒 PulseMarket

**A full-stack mobile marketplace** — React Native (Expo) app, Node.js/Express REST API,
PostgreSQL database, JWT auth with refresh-token rotation, Redis caching —
built with a CI/CD, containerisation, monitoring and scaling mindset.

`Mobile` · `Backend` · `PostgreSQL` · `Redis` · `Docker` · `CI/CD` · `Monitoring`

</div>

---

## 📖 Overview

PulseMarket is a complete marketplace: users can **browse and search products**,
**save favorites**, manage a **cart**, **check out** and track **orders**, while
sellers can **publish products**. The project is deliberately built as a
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
- Full-text product search with sorting (newest / price)
- Product detail with quantity picker and add-to-cart
- Favorites with optimistic (instant) UI updates
- Cart with quantity steppers and live totals
- Checkout + order history with status pills
- Profile, seller mode, and secure session persistence
- Access tokens stored in the OS keychain, silent refresh on 401

**Backend**
- REST API with a consistent `{ success, data }` envelope
- JWT auth: short-lived **access** token + **rotating refresh** tokens
- Refresh tokens stored **hashed** (SHA-256) and revocable on logout
- Role-based access control (`user`, `seller`, `admin`)
- Zod request validation, centralised error handling, structured logs
- Helmet, CORS, compression, global + auth-specific rate limiting
- Transactional order creation with row-level locks (no overselling)
- Graceful degradation when Redis is unavailable
- Health, readiness and Prometheus-format metrics endpoints

**Database**
- 9 tables with foreign keys, CHECK constraints and indexes
- Auto `updated_at` triggers
- Idempotent migration, seed data and a verification script

---

## 🧰 Tech Stack

| Layer            | Technology                                   |
|------------------|----------------------------------------------|
| Mobile           | React Native, Expo, expo-router, TypeScript  |
| State / storage  | Zustand, expo-secure-store                   |
| Backend          | Node.js 22, Express 4                        |
| Auth             | JSON Web Tokens (access + rotating refresh)  |
| Validation       | Zod                                          |
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
│   │   ├── checkout.tsx  orders.tsx
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

### 1 · Backend

```bash
cd backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run db:setup              # creates the DB, applies the schema, seeds data
npm run dev                   # -> http://localhost:5000
```

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
3. **Load demo data** — run `database/02_seed.sql`.
4. **Verify** — run `database/03_verify.sql` (prints row counts + the catalog).

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
| GET    | `/api/products`           | optional    | List / search (`q`, `category`, `sort`, `page`, `limit`) |
| GET    | `/api/products/:id`       | –           | Product detail                 |
| POST   | `/api/products`           | seller      | Create product                 |
| PUT    | `/api/products/:id`       | seller/owner| Update product                 |
| DELETE | `/api/products/:id`       | seller/owner| Delete product                 |
| GET    | `/api/categories`         | –           | Categories (`?withCounts=true`)|
| GET    | `/api/favorites`          | bearer      | My favorites                   |
| POST   | `/api/favorites`          | bearer      | Add favorite                   |
| DELETE | `/api/favorites/:id`      | bearer      | Remove favorite                |
| GET    | `/api/cart`               | bearer      | Get cart                       |
| POST   | `/api/cart`               | bearer      | Add to cart                    |
| PUT    | `/api/cart/:productId`    | bearer      | Change quantity                |
| DELETE | `/api/cart/:productId`    | bearer      | Remove line                    |
| POST   | `/api/orders`             | bearer      | Checkout (from cart)           |
| GET    | `/api/orders`             | bearer      | My orders (with items)         |
| GET    | `/api/orders/:id`         | bearer      | Order detail                   |
| PATCH  | `/api/orders/:id/status`  | bearer/owner| Update order status            |

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

On the mobile side: `npm run typecheck` passes with zero errors.

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
| Mobile can't reach the API | Android emulator must use `10.0.2.2`, not `localhost`; physical phones need your PC's LAN IP and both on the same Wi‑Fi. |
| `relation "users" does not exist` | Run `npm run migrate` (or the SQL files) first. |
| Redis warnings in the logs | Expected — Redis is optional in development. |
| Expo dependency warnings | `npx expo install --fix`. |

---

<div align="center">
<sub>Built as a portfolio project covering Mobile · Backend · Database · DevOps.</sub>
</div>
