-- Remove the PR #12 application-email-verification dependency without changing
-- existing table, Storage, or content policies. Those policies continue to
-- call these helpers and therefore still require an authenticated role.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('employee', 'admin', 'owner')
  )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'owner')
  )
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'owner'
  )
$$;
