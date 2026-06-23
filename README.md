# GarmentHub — Factory ERP

A dark-themed, mobile-responsive ERP for the **Enugu Fashion & Garment Hub**.
Built with **React + Vite + Tailwind CSS** and a **Supabase** backend (Postgres,
Auth, RLS).

## Features

- 🔐 Email/password auth (Supabase) with **role-based access** — the sidebar and
  every route filter pages by the signed-in user's role.
- 📊 Dashboard, Director's executive view, and consolidated Reports (Recharts).
- 🏭 Production orders, Weekly Tracker (week navigation + **PDF export**), Hourly Tracker.
- 📦 Raw Materials, Finished Products, Stock Movements, Bin Book (auto stock decrement).
- 👥 Workers, Attendance (searchable picker, auto edit mode, auto OT calc).
- 🛒 Sales/POS with live VAT + discount, Customers, Suppliers, Finances.
- ⚡ Power Outage log with auto-calculated downtime.
- 🛡 Users & Roles admin page.

## Roles

| Role | Access |
|------|--------|
| admin / factory_admin / manager | Everything |
| director | Director's View |
| supervisor | Production, Weekly Tracker |
| office_admin | Workers, Attendance, Power Outage |
| storekeeper | Raw Materials, Finished Products, Stock Movements, Suppliers, Power Outage, Bin Book |
| floor_assistant | Weekly Tracker, Hourly Tracker |

## Setup

### 1. Create the Supabase project
Go to [supabase.com](https://supabase.com) → **New project**.

### 2. Run the schema
In the dashboard: **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and **Run**.
Optionally run [`supabase/seed.sql`](supabase/seed.sql) for sample data.

### 3. Configure environment
```bash
cp .env.example .env
```
Fill in from **Project Settings → API**:
```
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 4. Run
```bash
npm install
npm run dev
```

### 5. First user
Open the app → **Create account**. The **first account created automatically
becomes the Administrator**. From the Users & Roles page you can then assign
roles to everyone else.

## Notes

- The data layer is isolated in `src/lib/supabase.js` + `src/api/db.js`. Every
  page goes through the uniform `table(name)` CRUD helper.
- Internal-app RLS: any authenticated staff member can read/write operational
  tables; page visibility is enforced by role in the UI. Profile role changes
  are restricted to admin-tier users at the database level.
- Email confirmation: if you leave it enabled in Supabase Auth settings, new
  users must confirm via email before signing in. For quick internal testing you
  can disable it under **Authentication → Providers → Email**.

## Stack
React 18 · Vite 5 · Tailwind 3 · Supabase JS v2 · React Router 6 · Recharts · jsPDF
