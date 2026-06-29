-- ============================================================================
-- Add "uniforms carried out" (collected / dispatched) to the daily log, so the
-- app can show the net outstanding for pickup. Run in the SQL Editor (re-runnable).
-- ============================================================================

alter table public.daily_production
  add column if not exists uniforms_carried_out int default 0;  -- collected / dispatched that day
