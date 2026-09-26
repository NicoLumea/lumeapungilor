-- Server-only, privacy-preserving authentication throttling.
-- Bucket keys are HMAC-SHA256 digests produced by the application server;
-- neither raw email addresses nor raw IP addresses are stored here.

create table public.login_rate_limits (
  key_hash text primary key,
  scope text not null check (scope in (
    'login_account_ip',
    'login_ip',
    'password_reset_account_ip',
    'password_reset_ip'
  )),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  window_started_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  blocked_until timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index login_rate_limits_expiry_idx on public.login_rate_limits (expires_at);

alter table public.login_rate_limits enable row level security;
revoke all on public.login_rate_limits from public, anon, authenticated;
grant all on public.login_rate_limits to service_role;

create or replace function public.check_auth_rate_limits(_keys text[])
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  wait_seconds integer;
begin
  delete from public.login_rate_limits where expires_at <= now();

  select greatest(0, ceil(extract(epoch from max(blocked_until) - now())))::integer
    into wait_seconds
    from public.login_rate_limits
   where key_hash = any(_keys)
     and blocked_until > now();

  return jsonb_build_object(
    'blocked', coalesce(wait_seconds, 0) > 0,
    'retry_after_seconds', coalesce(wait_seconds, 0)
  );
end;
$$;

create or replace function public.record_auth_rate_limit_event(
  _account_key text,
  _ip_key text,
  _account_scope text,
  _ip_scope text,
  _account_max integer,
  _ip_max integer,
  _window_seconds integer,
  _lockout_seconds integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  current_key text;
  current_scope text;
  current_max integer;
  current_row public.login_rate_limits%rowtype;
  next_attempts integer;
  wait_seconds integer;
begin
  if _account_max < 1 or _ip_max < _account_max
     or _window_seconds < 60 or _lockout_seconds < 60 then
    raise exception 'INVALID_RATE_LIMIT_CONFIGURATION' using errcode = '22023';
  end if;

  delete from public.login_rate_limits where expires_at <= now();

  for current_key, current_scope, current_max in
    select * from (values
      (_account_key, _account_scope, _account_max),
      (_ip_key, _ip_scope, _ip_max)
    ) as requested(key_hash, scope_name, max_attempts)
  loop
    insert into public.login_rate_limits (
      key_hash, scope, failed_attempts, window_started_at, expires_at
    ) values (
      current_key, current_scope, 0, now(), now() + make_interval(secs => _window_seconds + _lockout_seconds)
    ) on conflict (key_hash) do nothing;

    select * into current_row
      from public.login_rate_limits
     where key_hash = current_key
     for update;

    if current_row.blocked_until is not null and current_row.blocked_until > now() then
      update public.login_rate_limits
         set last_attempt_at = now(), updated_at = now()
       where key_hash = current_key;
      continue;
    end if;

    if current_row.window_started_at + make_interval(secs => _window_seconds) <= now() then
      next_attempts := 1;
      update public.login_rate_limits
         set scope = current_scope,
             failed_attempts = next_attempts,
             window_started_at = now(),
             last_attempt_at = now(),
             blocked_until = null,
             expires_at = now() + make_interval(secs => _window_seconds + _lockout_seconds),
             updated_at = now()
       where key_hash = current_key;
    else
      next_attempts := current_row.failed_attempts + 1;
      update public.login_rate_limits
         set scope = current_scope,
             failed_attempts = next_attempts,
             last_attempt_at = now(),
             blocked_until = case
               when next_attempts >= current_max then now() + make_interval(secs => _lockout_seconds)
               else null
             end,
             expires_at = case
               when next_attempts >= current_max
                 then now() + make_interval(secs => _lockout_seconds * 2)
               else now() + make_interval(secs => _window_seconds + _lockout_seconds)
             end,
             updated_at = now()
       where key_hash = current_key;
    end if;
  end loop;

  select greatest(0, ceil(extract(epoch from max(blocked_until) - now())))::integer
    into wait_seconds
    from public.login_rate_limits
   where key_hash = any(array[_account_key, _ip_key])
     and blocked_until > now();

  return jsonb_build_object(
    'blocked', coalesce(wait_seconds, 0) > 0,
    'retry_after_seconds', coalesce(wait_seconds, 0)
  );
end;
$$;

create or replace function public.clear_auth_rate_limit(_account_key text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from public.login_rate_limits where key_hash = _account_key;
$$;

revoke all on function public.check_auth_rate_limits(text[]) from public, anon, authenticated;
revoke all on function public.record_auth_rate_limit_event(text,text,text,text,integer,integer,integer,integer)
  from public, anon, authenticated;
revoke all on function public.clear_auth_rate_limit(text) from public, anon, authenticated;

grant execute on function public.check_auth_rate_limits(text[]) to service_role;
grant execute on function public.record_auth_rate_limit_event(text,text,text,text,integer,integer,integer,integer)
  to service_role;
grant execute on function public.clear_auth_rate_limit(text) to service_role;

comment on table public.login_rate_limits is
  'Short-lived server-only authentication throttle buckets. Keys contain HMAC digests, never raw identifiers, IPs, or passwords.';
