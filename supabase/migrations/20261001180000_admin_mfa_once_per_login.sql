-- Require the email challenge once for each privileged Supabase session.
-- Authorization is bound to auth.uid() plus the unforgeable session_id claim,
-- so a verified session can perform every role-authorized action without a
-- second challenge. A new login creates a new session_id and must verify again.

create or replace function public.has_staff_verification()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.staff_verified_sessions verified
    where verified.user_id = auth.uid()
      and verified.auth_session_id = coalesce(auth.jwt()->>'session_id', '')
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification()
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('employee', 'admin', 'owner')
    )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification()
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification()
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'owner'
    )
$$;

revoke execute on function public.has_staff_verification() from public, anon;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.has_staff_verification() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;

comment on function public.has_staff_verification() is
  'True only when the current authenticated Supabase session completed the staff email challenge.';
comment on function public.is_staff() is
  'Verified current session with a trusted Employee, Admin, or Owner role.';
comment on function public.is_admin() is
  'Verified current session with a trusted Admin or Owner role.';
comment on function public.is_owner() is
  'Verified current session with a trusted Owner role.';
