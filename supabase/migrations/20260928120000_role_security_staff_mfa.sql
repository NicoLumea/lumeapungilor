-- Application-level staff email verification. This is intentionally not a
-- Supabase AAL2 factor: verified sessions remain aal1 and gain only the
-- application-specific privilege recorded below.

create table public.staff_login_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  auth_session_id text not null,
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  used_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index staff_login_challenges_session_idx
  on public.staff_login_challenges (user_id, auth_session_id, created_at desc);
create index staff_login_challenges_expiry_idx on public.staff_login_challenges (expires_at);
create unique index staff_login_challenges_one_active_idx
  on public.staff_login_challenges (user_id, auth_session_id)
  where used_at is null and invalidated_at is null;
alter table public.staff_login_challenges enable row level security;
revoke all on public.staff_login_challenges from public, anon, authenticated;
grant all on public.staff_login_challenges to service_role;
create trigger staff_login_challenges_updated before update on public.staff_login_challenges
  for each row execute function public.set_updated_at();

create or replace function public.take_staff_mfa_attempt(_challenge_id uuid)
returns integer language plpgsql volatile security definer set search_path = public as $$
declare next_attempt integer;
begin
  update public.staff_login_challenges
    set attempts = attempts + 1
    where id = _challenge_id
      and used_at is null
      and invalidated_at is null
      and expires_at > now()
      and attempts < 5
    returning attempts into next_attempt;
  return coalesce(next_attempt, 0);
end; $$;
revoke all on function public.take_staff_mfa_attempt(uuid) from public, anon, authenticated;
grant execute on function public.take_staff_mfa_attempt(uuid) to service_role;

create table public.staff_verified_sessions (
  auth_session_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index staff_verified_sessions_user_idx on public.staff_verified_sessions (user_id, expires_at);
alter table public.staff_verified_sessions enable row level security;
revoke all on public.staff_verified_sessions from public, anon, authenticated;
grant all on public.staff_verified_sessions to service_role;

-- The project has a single owner bootstrap. The partial index also closes the
-- race where two valid setup requests arrive before either sees the other.
create unique index if not exists user_roles_single_owner_idx
  on public.user_roles (role) where role = 'owner';

create or replace function public.has_staff_verification()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.staff_verified_sessions verified
    where verified.user_id = auth.uid()
      and verified.auth_session_id = coalesce(auth.jwt()->>'session_id', '')
      and verified.expires_at > now()
  )
$$;
revoke execute on function public.has_staff_verification() from public, anon;
grant execute on function public.has_staff_verification() to authenticated;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification() and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('employee','admin','owner')
  )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification() and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin','owner')
  )
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification() and exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'owner'
  )
$$;

revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;

-- Employees need only their own role. Team-wide role/profile access is admin-only.
drop policy if exists "staff read roles" on public.user_roles;
create policy "admins read roles" on public.user_roles for select to authenticated
  using (public.is_admin());

-- Global settings and CMS content are an administrator/owner boundary.
drop policy if exists "staff read settings" on public.site_settings;
create policy "admins read settings" on public.site_settings for select to authenticated
  using (public.is_admin());

drop policy if exists "staff read sections" on public.content_sections;
drop policy if exists "staff edit drafts" on public.content_sections;
drop policy if exists "staff update drafts" on public.content_sections;
create policy "admins read sections" on public.content_sections for select to authenticated
  using (public.is_admin());
create policy "admins insert sections" on public.content_sections for insert to authenticated
  with check (public.is_admin());
create policy "admins update sections" on public.content_sections for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "staff manage content" on public.site_content;

create or replace function public.audit_content_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'content.created' else 'content.updated' end,
    tg_table_name,
    coalesce(new.key, old.key),
    '{}'::jsonb
  );
  return new;
end; $$;
revoke execute on function public.audit_content_change() from public, anon, authenticated;
drop trigger if exists site_content_audit on public.site_content;
create trigger site_content_audit after insert or update on public.site_content
  for each row execute function public.audit_content_change();
drop trigger if exists site_settings_audit on public.site_settings;
create trigger site_settings_audit after insert or update on public.site_settings
  for each row execute function public.audit_content_change();

-- A role change immediately invalidates every privileged verification for that user.
create or replace function public.invalidate_staff_verification_on_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.staff_verified_sessions where user_id = coalesce(new.user_id, old.user_id);
  update public.staff_login_challenges
    set invalidated_at = now()
    where user_id = coalesce(new.user_id, old.user_id)
      and used_at is null and invalidated_at is null;
  return coalesce(new, old);
end; $$;
revoke execute on function public.invalidate_staff_verification_on_role_change()
  from public, anon, authenticated;
drop trigger if exists user_roles_invalidate_staff_verification on public.user_roles;
create trigger user_roles_invalidate_staff_verification
  after insert or update or delete on public.user_roles
  for each row execute function public.invalidate_staff_verification_on_role_change();

comment on table public.staff_login_challenges is
  'Server-only metadata for Supabase-delivered staff email OTP challenges. OTP values are never stored here.';
comment on table public.staff_verified_sessions is
  'Short-lived application-level privileged verification bound to a Supabase auth session_id; this does not change JWT AAL.';
