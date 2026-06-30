-- ============================================================================
-- Link each daily production entry to a Production order. Run in the SQL Editor
-- (re-runnable). Requires the daily_production table to already exist.
-- ============================================================================

alter table public.daily_production
  add column if not exists order_number text;  -- selected from existing production orders
