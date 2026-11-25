# Artle Bakeshop

> **Baked With Passion, Shared With Love**

**Artle Bakeshop** is a real e-commerce platform built for the **Artle Bakeshop** bakery store (Ho Chi Minh City, Vietnam). Customers can order baked goods online without an account, while admins get a complete system to run the business.

🔗 **Live demo:** [https://artlebake-shop.vercel.app](https://artlebake-shop.vercel.app)

---

## 📖 Overview

**Artle Bakeshop** is a production-order system for a real bakery with **2 ordering modes**:

| Mode | Description |
|---|---|
| 🍞 **Available today (Daily-bake)** | Products baked/sold that day with limited quantities. Staff update daily inventory and the store starts accepting online orders from **10:00 AM**. |
| 📅 **Preorder** | Customers order products for a specific future date based on a preorder schedule set up by the admin. |

After placing an order, customers pay online (PayOS) and receive an **order confirmation email**. Customers **do not need an account** to place an order — a frictionless checkout experience.

Admins have a full-featured **admin panel**:

- ✅ Manage products, categories, and ingredients
- ✅ Manage **daily inventory** (products available today)
- ✅ Manage the **preorder schedule** and which products are preorderable on each day
- ✅ Manage **orders** and order statuses
- ✅ **Dashboard** with revenue, orders, and best-seller analytics

---

## ✨ Features

### 🛍️ Customer store (No login required)

- 🏠 Landing page with branding, story, and bestseller sections
- 🍞 Menu & product detail pages (bilingual **EN / VI**)
- 🔍 Product search & category filtering
- 🛒 Shopping cart persisted per session
- 🛍️ Flexible order flow:
  - **Available today** products (inventory locked at order time)
  - **Preorder** products based on available preorder dates
  - Delivery method: **home delivery** or **store pickup**
- 💳 Online payment via **PayOS** (QR/Visa/PayOS), unpaid orders auto-cancelled after 5 minutes
- 📧 **Order confirmation email** after successful payment
- 🌐 Bilingual EN / VI interface, mobile-first responsive

### 🔐 Admin Panel

- 📊 **Dashboard**: monthly orders, monthly revenue, products sold, unshipped orders; charts for revenue, total orders, order-status distribution, and top sellers
- 🍞 **Products**: CRUD, image upload (Cloudinary), enable/disable, soft delete/restore
- 🏷️ **Categories**: manage product categories
- 🧂 **Ingredients**: manage ingredients
- 📦 **Daily Inventory**: manage daily quantities and status (`draft`, `available`, `low_stock`, `out_of_stock`, `closed`), publish the daily menu
- 📅 **Preorder Schedule**: calendar-based schedule, enable/disable
- 🧾 **Preorder Items**: assign products to each preorder date
- 📋 **Orders**: view and update order status (`pending` → `confirmed` → `delivered` / `cancelled`) and payment status (`unpaid`, `paid`, `failed`, `refunded`)
- 👥 **Staffs / Users**: manage accounts and roles (`admin`, `staff`, `user`)
- 🔐 **Supabase Auth**: email/password, Google OAuth, signup, change password, reset password

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| [Next.js 14 (App Router)](https://nextjs.org) | Full-stack framework (React + Node.js API Routes) |
| [TypeScript](https://www.typescriptlang.org) | Language |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI | Component system |
| [Supabase](https://supabase.com) | Database (PostgreSQL), Auth, RPC functions |
| [Redis (Aiven / ioredis)](https://redis.io) | Data cache, rate limiting |
| [BullMQ](https://docs.bullmq.io) | Background queue & workers (emails, auto-cancel orders) |
| [SendGrid](https://sendgrid.com) | Order confirmation emails (React Email templates) |
| [PayOS](https://payos.vn) | Online payment gateway (webhook confirmation) |
| [Cloudinary](https://cloudinary.com) | Product image storage & optimization |
| [Vercel](https://vercel.com) | Hosting & deployment (cron jobs) |

> **Node.js** powers the Next.js API routes, the background worker (tsx + BullMQ), and operational tasks.

---


### Order flow

```text
Customer selects products → Cart → Fills in delivery info
      → Chooses delivery method (delivery/pickup)
      → Chooses order type (today / preorder + preorder date)
      → Creates order (Supabase RPC — safe stock lock)
      → Redirected to PayOS checkout (expires in 5 minutes)
      → PayOS webhook → payment confirmed → status updated
      → BullMQ enqueue → Worker sends confirmation email (SendGrid)
      → Admin updates order status (confirmed → delivered)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18 (recommended 20+)
- npm
- A Supabase project (or Supabase CLI to run migrations)
- A Redis server (Aiven)
- Accounts: SendGrid, PayOS, Cloudinary, Google OAuth

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
#   (see the variable list below)

# 3. Set up the database & run migrations
supabase link --project-ref <PROJECT_REF>
supabase db push

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> ⚠️ The project requires Redis for the BullMQ queue (email channel). If you don't have Redis yet, run a local instance (`docker run -p 6379:6379 redis`) and update `AIVEN_REDIS_URI`.

### FastAPI storefront reads (optional)

Set the server-side `FASTAPI_BASE_URL` to an HTTP(S) FastAPI base URL for the migrated product, menu, and preorder-date reads, as well as active menu categories. For example:

```env
FASTAPI_BASE_URL=http://127.0.0.1:8000
```

When this variable is unset, categories, products, and preorder dates continue to use Supabase. Do not expose this setting with a `NEXT_PUBLIC_` prefix. Until checkout cutover is approved, product, category, preorder-schedule IDs, and stock must remain aligned with the legacy checkout data.

Checkout/payment migration is separately disabled by default. Set the server-only `FASTAPI_CHECKOUT_ENABLED=true` only in a test environment after Phase 6 webhook and payment-expiry/job ownership have been verified in that same environment. `FASTAPI_BASE_URL` alone never switches checkout, and this flag must remain unset until those prerequisites are met.

For FastAPI test callbacks, configure the backend's `APP_BASE_URL` as the Next storefront origin so PayOS returns to its `/payment` route. Before switching checkout ownership, drain or expire pending legacy PayOS orders so their callbacks are not routed through the new provider.

FastAPI authentication is separately opt-in and remains on Supabase unless both `FASTAPI_BASE_URL` and the server-only `FASTAPI_AUTH_ENABLED=true` are set. Keep it disabled until the auth migration is verified in a test environment; customer signup, OAuth callback, and password registration remain on Supabase. The browser coordinates refresh rotation across tabs with Web Locks and same-origin local storage; clients without both capabilities fail closed on an expired access token. Refresh coordination is not server-side or cross-worker, so do not enable production cutover until that limitation and the cookie/CSRF behavior have been verified.

FastAPI admin routes are separately opt-in with the server-only `FASTAPI_ADMIN_ENABLED=true`; it defaults to legacy Supabase handlers. Enable it only in a test environment after `FASTAPI_BASE_URL` and `FASTAPI_AUTH_ENABLED=true` are configured and the same admin identities, product/category/schedule IDs, and stock are aligned with legacy checkout while Phase 3 remains pending. The admin proxy forwards the access cookie and CSRF header, and the browser refreshes through `/api/auth/refresh` after an authenticated admin 401. Admin behavior still differs in two important ways: daily-inventory publishing does not reopen closed rows, and disabling a staff member also disables their account and revokes sessions. Verify these effects, plus role/UUID mappings and data ownership, before any production cutover; Phase 6 operational ownership remains a prerequisite.

### FastAPI operations ownership (Phase 6; not cut over)

`FASTAPI_CHECKOUT_ENABLED` and `FASTAPI_CRON_ENABLED` are server-only, default-off switches. The checkout flag routes checkout and the existing PayOS webhook ingress through FastAPI; the cron flag routes only the three existing Next.js cron endpoints (`close-daily-inventories`, `close-preorder`, and `publish-menu`) to matching FastAPI `/cron/*` endpoints using server-side `CRON_SECRET`. Enabling cron forwarding requires both `FASTAPI_BASE_URL` and `CRON_SECRET`; missing configuration fails closed. The FastAPI worker's `WORKER_SCHEDULED_JOBS_ENABLED` is a separate switch. **Environment ownership is unverified; keep all cutover flags off.**

| Responsibility | Legacy owner | FastAPI option | Pre-cutover rule |
|---|---|---|---|
| Daily inventory, preorder close, menu publish | External scheduler calls the Next.js cron endpoints, which update Supabase. | Either external scheduler calls FastAPI `/cron/*` (or these Next routes proxy with `FASTAPI_CRON_ENABLED=true`), or the arq worker runs these jobs with `WORKER_SCHEDULED_JOBS_ENABLED=true`. | Select one scheduler per job. Never schedule the same daily job through both `/cron/*` and the worker. Polling worker mode does not schedule daily jobs. |
| PayOS webhook | PayOS calls the Next.js `/api/webhooks/payos`, which verifies the signature and updates Supabase. | Keep that single PayOS callback URL; with `FASTAPI_CHECKOUT_ENABLED=true`, Next forwards the original signed JSON to FastAPI `/webhooks/payos`. | Do not configure PayOS to also deliver to FastAPI directly. Verify signatures, acknowledgements, failures, duplicate/reordered callbacks, and drain pending legacy orders before switching ownership. |
| Payment expiry and confirmation email | BullMQ processes per-order expiry and sends confirmation email after the legacy webhook. | FastAPI's arq worker processes queue jobs and runs bounded expiry/outbox passes; polling mode uses PostgreSQL for expiry/outbox when `REDIS_URL` is unset. FastAPI also exposes `/cron/expire-payments` and `/cron/deliver-emails`. | Choose one owner for each expiry/email job and drain or reconcile legacy BullMQ jobs and pending orders before cutover. Do not treat idempotency as proof that duplicate schedulers are harmless operationally. |
| Readiness and worker health | Legacy deployment/process monitoring. | `/health` reports API liveness. `/health/ready` requires PostgreSQL (`503` if unavailable); Redis status (`ok`, `unavailable`, or `disabled`) is informational and does not change readiness. `python -m app.worker --check` succeeds only when an arq worker heartbeat is present in Redis; polling mode has no heartbeat. | Monitor the database and Redis/worker status separately. A ready API does not prove a worker is consuming jobs. |

With `REDIS_URL` unset, FastAPI uses polling mode for payment expiry and email outbox delivery, backed by PostgreSQL; daily jobs still need exactly one external scheduler. With `REDIS_URL` configured but Redis unavailable, readiness may remain successful while Redis is reported unavailable; arq queue processing is degraded and does not automatically switch to polling. Before enabling either flag, verify environment ownership and configuration, matching `CRON_SECRET`, one scheduler/webhook target per responsibility, signed PayOS success/failure/replay behavior, idempotent cron runs, expiry and email delivery/retry ownership, worker heartbeat in arq mode, PostgreSQL fallback and Redis degradation behavior, and a tested rollback path in the same non-production environment. None of that ownership evidence is currently established.

### Run the background worker (separate process)

```bash
npm run worker:dev
```

Handles: order confirmation emails, auto-cancelling expired-payment orders.

---

## 🌐 Deployment

- **Frontend & API:** Vercel — [https://artlebake-shop.vercel.app](https://artlebake-shop.vercel.app)
- **Database & Auth:** Supabase (PostgreSQL + RPC + Auth + webhook receiver)
- **Redis:** Aiven Redis (cache + BullMQ queue)
- **Cron jobs:** Vercel Cron (configured in the Vercel dashboard)
- **Worker:** runs as a separate process (`tsx worker/src/index.ts`) on an environment with Redis connectivity (Aiven Redis / Upstash)

> Hint: push to the main branch to auto-deploy on Vercel; Vercel runs `next build` and starts the server automatically.

---

## 📝 License

© Artle Bakeshop — A commercial project powering the day-to-day operation of the **Artle Bakeshop** store.