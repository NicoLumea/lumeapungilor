-- Administrators and Owners authenticate with their normal Supabase session and
-- trusted database role. Only effective Employee accounts retain the additional
-- application email-code challenge.

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
    or (
      public.has_staff_verification()
      and exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'employee'
      )
    )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'owner')
  )
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'owner'
  )
$$;

comment on function public.is_staff() is
  'Trusted Admin/Owner role, or trusted Employee role with current email verification.';
comment on function public.is_admin() is
  'Trusted Admin/Owner role for the current authenticated user.';
comment on function public.is_owner() is
  'Trusted Owner role for the current authenticated user.';
