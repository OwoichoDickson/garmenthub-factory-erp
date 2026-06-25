-- ============================================================================
-- Multiple roles per user. Run this in the Supabase SQL Editor (safe to re-run).
-- Adds profiles.roles (text[]) as the source of truth; the old single `role`
-- column is kept and mirrors roles[1] for compatibility.
-- ============================================================================

-- 1) Add the array column and backfill from the existing single role.
alter table public.profiles add column if not exists roles text[];
update public.profiles set roles = array[role] where roles is null or roles = '{}';
alter table public.profiles alter column roles set default '{office_admin}';
alter table public.profiles alter column roles set not null;

-- 2) Admin check: true if ANY of the user's roles is admin-tier.
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and roles && array['admin','factory_admin','manager']
  );
$$;

-- 3) New users: set both role and roles (first ever user becomes admin).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  user_count int;
  first_role text;
begin
  select count(*) into user_count from public.profiles;
  first_role := case when user_count = 0 then 'admin' else 'office_admin' end;
  insert into public.profiles (id, email, full_name, role, roles)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    first_role,
    array[first_role]
  );
  return new;
end $$;

-- 4) Keep role and roles in sync, and stop non-admins changing their own roles.
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  -- Non-admins cannot change role/roles at all.
  if (new.role is distinct from old.role or new.roles is distinct from old.roles)
     and not public.is_admin() then
    new.role := old.role;
    new.roles := old.roles;
    return new;
  end if;
  -- Never allow an empty roles array; mirror role <-> roles[1].
  if new.roles is null or array_length(new.roles, 1) is null then
    new.roles := array[coalesce(new.role, 'office_admin')];
  end if;
  new.role := new.roles[1];
  return new;
end $$;
