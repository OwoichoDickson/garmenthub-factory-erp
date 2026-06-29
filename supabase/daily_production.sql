-- ============================================================================
-- Daily Production log — uniforms ready for pickup, uniforms awaiting badges,
-- and badges produced. One entry per day. Run in the Supabase SQL Editor
-- (safe to re-run).
-- ============================================================================

create table if not exists public.daily_production (
  id                         uuid primary key default gen_random_uuid(),
  date                       date not null default current_date,
  uniforms_ready_pickup      int  default 0,   -- finished uniforms ready to be collected
  uniforms_awaiting_badges   int  default 0,   -- uniforms done but waiting for badges
  badges_produced            int  default 0,   -- badges made that day
  notes                      text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- updated_at trigger (reuses the shared function from schema.sql)
drop trigger if exists trg_daily_production_updated on public.daily_production;
create trigger trg_daily_production_updated before update on public.daily_production
  for each row execute function public.set_updated_at();

-- Row level security: any authenticated staff member can read/write.
alter table public.daily_production enable row level security;
drop policy if exists "auth_all" on public.daily_production;
create policy "auth_all" on public.daily_production
  for all to authenticated using (true) with check (true);
