-- ============================================================================
-- Google OAuth support — run this in the Supabase SQL Editor if you already ran
-- schema.sql before Google sign-in was added. It updates the new-user trigger
-- so a Google account's name flows into the profile. Safe to re-run.
-- ============================================================================

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
