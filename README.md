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