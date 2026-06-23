-- ============================================================================
-- GarmentHub — Factory ERP : Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query → Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------- Generic updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
-- PROFILES + ROLES  (drives the role-based sidebar)
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'office_admin'
              check (role in ('admin','factory_admin','manager','director',
                              'supervisor','office_admin','storekeeper','floor_assistant')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Is the current user an admin-tier user? (SECURITY DEFINER bypasses RLS -> no recursion)
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin','factory_admin','manager')
  );
$$;

-- Auto-create a profile when a user signs up. First ever user becomes 'admin'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  user_count int;
begin
  select count(*) into user_count from public.profiles;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    -- email/password sign-up sends full_name; Google OAuth sends name/full_name
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    case when user_count = 0 then 'admin' else 'office_admin' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- OPERATIONAL TABLES
-- ============================================================================

create table if not exists public.workers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  employee_id  text,
  role         text check (role in ('operator','supervisor','technician','quality_inspector',
                                    'packer','floor_assistant','storekeeper','monogrammer','cutter')),
  department   text check (department in ('cutting','sewing','finishing','packaging','quality','warehouse')),
  team         text,
  shift        text check (shift in ('morning','afternoon','night')),
  phone        text,
  hourly_rate  numeric default 0,
  status       text default 'active' check (status in ('active','on_leave','terminated')),
  hire_date    date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.attendance (
  id              uuid primary key default gen_random_uuid(),
  worker_name     text,
  worker_id       text,
  date            date not null default current_date,
  shift           text check (shift in ('morning','afternoon','night')),
  clock_in        text,
  clock_out       text,
  hours_worked    numeric default 0,
  overtime_hours  numeric default 0,
  status          text default 'present' check (status in ('present','absent','late','half_day','on_leave')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.power_outages (
  id           uuid primary key default gen_random_uuid(),
  date         text,
  month        text,
  year         int,
  power_off    text,
  power_back   text,
  duration     text,
  total_hours  numeric default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.weekly_production_entries (
  id                   uuid primary key default gen_random_uuid(),
  date                 date not null,
  week_label           text,
  department           text check (department in ('sewing','cutting','finishing','ironing','packaging_qc')),
  team_or_worker_name  text,
  product_category     text check (product_category in ('top','bottom')),
  product_type         text check (product_type in ('shirts','pinafore','shorts','trouser','skirt','other')),
  style_description     text,
  target_per_day       int default 0,
  day_output           int default 0,
  night_output         int default 0,
  remarks              text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.hourly_progress (
  id              uuid primary key default gen_random_uuid(),
  worker_name     text,
  worker_id       text,
  date            date not null default current_date,
  hour            text,
  shift           text check (shift in ('morning','afternoon','night')),
  department      text,
  units_produced  int default 0,
  defects         int default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.production_orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text,
  product_name     text,
  design_code      text,
  target_quantity  int default 0,
  actual_output    int default 0,
  defects          int default 0,
  waste_kg         numeric default 0,
  shift            text check (shift in ('morning','afternoon','night')),
  stage            text check (stage in ('cutting','sewing','finishing','packaging')),
  status           text default 'pending' check (status in ('pending','in_progress','completed','delayed')),
  assigned_team    text[] default '{}',
  start_date       date,
  due_date         date,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.raw_materials (
  id                  uuid primary key default gen_random_uuid(),
  fabric_type         text not null,
  color               text,
  gsm                 int,
  cost_per_unit       numeric default 0,
  batch_number        text,
  warehouse_location  text,
  supplier            text,
  quantity            numeric default 0,
  unit                text check (unit in ('meters','yards','kg','rolls')),
  reorder_level       numeric default 0,
  status              text default 'in_stock' check (status in ('in_stock','low_stock','out_of_stock')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.finished_products (
  id                  uuid primary key default gen_random_uuid(),
  sku                 text,
  product_name        text not null,
  size                text check (size in ('XS','S','M','L','XL','XXL')),
  color               text,
  design_code         text,
  production_batch    text,
  cost_price          numeric default 0,
  selling_price       numeric default 0,
  quantity_available  int default 0,
  category            text check (category in ('shirts','pants','dresses','jackets','uniforms','accessories','other')),
  image_url           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id             uuid primary key default gen_random_uuid(),
  material_type  text check (material_type in ('raw_material','finished_product')),
  item_name      text,
  item_id        text,
  movement_type  text check (movement_type in ('stock_in','stock_out','adjustment','production_use','production_output','sale')),
  quantity       numeric default 0,
  reference      text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id               uuid primary key default gen_random_uuid(),
  invoice_number   text,
  customer_name    text,
  customer_id      text,
  order_type       text check (order_type in ('wholesale','retail')),
  items            jsonb default '[]',
  subtotal         numeric default 0,
  discount_percent numeric default 0,
  vat_percent      numeric default 16,
  vat_amount       numeric default 0,
  total_amount     numeric default 0,
  payment_status   text default 'unpaid' check (payment_status in ('paid','partial','unpaid')),
  payment_method   text check (payment_method in ('cash','card','bank_transfer','mixed')),
  amount_paid      numeric default 0,
  status           text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text check (type in ('wholesale','retail')),
  email         text,
  phone         text,
  address       text,
  company       text,
  credit_limit  numeric default 0,
  total_orders  int default 0,
  total_spent   numeric default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.suppliers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  contact_person      text,
  email               text,
  phone               text,
  address             text,
  materials_supplied  text[] default '{}',
  payment_terms       text check (payment_terms in ('net_15','net_30','net_60','cod')),
  rating              int check (rating between 1 and 5),
  status              text default 'active' check (status in ('active','inactive')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  category       text check (category in ('raw_materials','labor','utilities','maintenance','transport','rent','equipment','other')),
  description    text,
  amount         numeric default 0,
  date           date not null default current_date,
  payment_method text,
  receipt_url    text,
  approved_by    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.bin_items (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text check (category in ('thread','zip','elastic','needle','tape','chalk','pencil','pin','fabric','other')),
  store          text check (store in ('Store A','Store B')),
  unit           text check (unit in ('pcs','rolls','meters','yards','kg','boxes','packets')),
  opening_stock  numeric default 0,
  current_stock  numeric default 0,
  reorder_level  numeric default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.bin_entries (
  id               uuid primary key default gen_random_uuid(),
  item_id          text,
  item_name        text,
  store            text check (store in ('Store A','Store B')),
  date             date not null default current_date,
  month            text,
  quantity_issued  numeric default 0,
  issued_to        text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- attach updated_at triggers to every operational table ----------
do $$
declare t text;
begin
  foreach t in array array[
    'workers','attendance','power_outages','weekly_production_entries','hourly_progress',
    'production_orders','raw_materials','finished_products','stock_movements','sales_orders',
    'customers','suppliers','expenses','bin_items','bin_entries'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Internal app: any authenticated staff member can read/write operational data.
-- Page-level visibility is enforced in the UI by role. Profile role changes are
-- restricted to admin-tier users.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'workers','attendance','power_outages','weekly_production_entries','hourly_progress',
    'production_orders','raw_materials','finished_products','stock_movements','sales_orders',
    'customers','suppliers','expenses','bin_items','bin_entries'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "auth_all" on public.%I;', t);
    execute format($p$create policy "auth_all" on public.%I
                     for all to authenticated using (true) with check (true);$p$, t);
  end loop;
end $$;

-- profiles RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Prevent a non-admin from escalating their own role.
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;  -- silently keep old role for non-admins
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_role on public.profiles;
create trigger trg_guard_role before update on public.profiles
  for each row execute function public.guard_role_change();

-- ============================================================================
-- Done. Next: run seed.sql (optional sample data), then sign up your first
-- user in the app — that account automatically becomes 'admin'.
-- ============================================================================
