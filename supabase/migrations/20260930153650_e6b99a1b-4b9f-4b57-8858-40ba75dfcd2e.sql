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
create index staff_login_challenges_session_idx on public.staff_login_challenges (user_id, auth_session_id, created_at desc);
create index staff_login_challenges_expiry_idx on public.staff_login_challenges (expires_at);
create unique index staff_login_challenges_one_active_idx on public.staff_login_challenges (user_id, auth_session_id) where used_at is null and invalidated_at is null;
alter table public.staff_login_challenges enable row level security;
revoke all on public.staff_login_challenges from public, anon, authenticated;
grant all on public.staff_login_challenges to service_role;
create trigger staff_login_challenges_updated before update on public.staff_login_challenges for each row execute function public.set_updated_at();

create or replace function public.take_staff_mfa_attempt(_challenge_id uuid)
returns integer language plpgsql volatile security definer set search_path = public as $$
declare next_attempt integer;
begin
  update public.staff_login_challenges set attempts = attempts + 1
    where id = _challenge_id and used_at is null and invalidated_at is null and expires_at > now() and attempts < 5
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

create or replace function public.has_staff_verification()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_verified_sessions verified
    where verified.user_id = auth.uid()
      and verified.auth_session_id = coalesce(auth.jwt()->>'session_id', '')
      and verified.expires_at > now())
$$;
revoke execute on function public.has_staff_verification() from public, anon;
grant execute on function public.has_staff_verification() to authenticated;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification() and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('employee','admin','owner'))
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification() and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','owner'))
$$;
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_staff_verification() and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'owner')
$$;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;

drop policy if exists "staff read roles" on public.user_roles;
drop policy if exists "admins read roles" on public.user_roles;
create policy "admins read roles" on public.user_roles for select to authenticated using (public.is_admin());

drop policy if exists "staff read settings" on public.site_settings;
drop policy if exists "admins read settings" on public.site_settings;
create policy "admins read settings" on public.site_settings for select to authenticated using (public.is_admin());

drop policy if exists "staff read sections" on public.content_sections;
drop policy if exists "staff edit drafts" on public.content_sections;
drop policy if exists "staff update drafts" on public.content_sections;
drop policy if exists "admins manage sections" on public.content_sections;
create policy "admins manage sections" on public.content_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "staff manage content" on public.site_content;
drop policy if exists "admins manage content" on public.site_content;
create policy "admins manage content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.audit_content_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), case when tg_op = 'INSERT' then 'content.created' else 'content.updated' end,
    tg_table_name, coalesce(new.key, old.key), '{}'::jsonb);
  return new;
end; $$;
revoke execute on function public.audit_content_change() from public, anon, authenticated;
drop trigger if exists site_content_audit on public.site_content;
create trigger site_content_audit after insert or update on public.site_content for each row execute function public.audit_content_change();
drop trigger if exists site_settings_audit on public.site_settings;
create trigger site_settings_audit after insert or update on public.site_settings for each row execute function public.audit_content_change();

create or replace function public.invalidate_staff_verification_on_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.staff_verified_sessions where user_id = coalesce(new.user_id, old.user_id);
  update public.staff_login_challenges set invalidated_at = now()
    where user_id = coalesce(new.user_id, old.user_id) and used_at is null and invalidated_at is null;
  return coalesce(new, old);
end; $$;
revoke execute on function public.invalidate_staff_verification_on_role_change() from public, anon, authenticated;
drop trigger if exists user_roles_invalidate_staff_verification on public.user_roles;
create trigger user_roles_invalidate_staff_verification after insert or update or delete on public.user_roles
  for each row execute function public.invalidate_staff_verification_on_role_change();

create or replace function public.admin_users_dashboard(
  _search text default null, _role text default null, _source text default null, _status text default null,
  _date_from timestamptz default null, _date_to timestamptz default null, _sort text default 'newest',
  _page integer default 1, _page_size integer default 25
)
returns jsonb language plpgsql stable security definer set search_path = public, auth
as $$
declare result jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if _role is not null and _role not in ('customer', 'employee', 'admin', 'owner') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;
  if _source is not null and _source not in ('account', 'order', 'restock') then
    raise exception 'INVALID_SOURCE' using errcode = '22023';
  end if;
  if _status is not null and _status not in ('active', 'disabled', 'pending') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;
  if _sort not in ('newest', 'latest_login', 'latest_order', 'email') then
    raise exception 'INVALID_SORT' using errcode = '22023';
  end if;

  with role_rollup as (
    select ur.user_id,
      case when bool_or(ur.role = 'owner') then 'owner'
           when bool_or(ur.role = 'admin') then 'admin'
           when bool_or(ur.role = 'employee') then 'employee'
           else 'customer' end as system_role
    from public.user_roles ur group by ur.user_id
  ), order_rollup as (
    select o.user_id, count(*)::integer as order_count, max(o.created_at) as latest_order_at
    from public.orders o where o.user_id is not null and o.is_test = false group by o.user_id
  ), restock_rollup as (
    select lower(r.email) as email, count(*)::integer as restock_count, max(r.created_at) as latest_restock_at
    from public.restock_requests r group by lower(r.email)
  ), base as (
    select u.id, u.email, 'customer'::text as account_type,
      coalesce(rr.system_role, 'customer') as role, u.created_at,
      (u.email_confirmed_at is not null) as email_confirmed, u.last_sign_in_at,
      case when u.banned_until is not null and u.banned_until > now() then 'disabled'
           when u.email_confirmed_at is null then 'pending' else 'active' end as account_status,
      coalesce(ord.order_count, 0) as order_count, ord.latest_order_at,
      null::integer as cart_item_count, coalesce(res.restock_count, 0) as restock_count,
      greatest(ord.latest_order_at, res.latest_restock_at) as latest_signal_at,
      case when coalesce(ord.order_count, 0) > 0 then 'A plasat comandă'
           when coalesce(res.restock_count, 0) > 0 then 'Cerere revenire în stoc'
           else 'Cont înregistrat' end as source_label
    from auth.users u
    left join role_rollup rr on rr.user_id = u.id
    left join order_rollup ord on ord.user_id = u.id
    left join restock_rollup res on res.email = lower(u.email)
    where u.deleted_at is null and u.email is not null
  ), filtered as (
    select * from base b
    where (_search is null or b.email ilike '%' || trim(_search) || '%')
      and (_role is null or b.role = _role)
      and (_status is null or b.account_status = _status)
      and (_date_from is null or b.created_at >= _date_from)
      and (_date_to is null or b.created_at < _date_to)
      and (_source is null or (_source = 'account')
        or (_source = 'order' and b.order_count > 0)
        or (_source = 'restock' and b.restock_count > 0))
  ), page_rows as (
    select * from filtered
    order by
      case when _sort = 'newest' then created_at end desc nulls last,
      case when _sort = 'latest_login' then last_sign_in_at end desc nulls last,
      case when _sort = 'latest_order' then latest_order_at end desc nulls last,
      case when _sort = 'email' then lower(email) end asc nulls last,
      created_at desc
    offset (greatest(_page, 1) - 1) * least(greatest(_page_size, 1), 10000)
    limit least(greatest(_page_size, 1), 10000)
  ), stats as (
    select count(*)::integer as total_accounts,
      count(*) filter (where role = 'customer')::integer as customers,
      count(*) filter (where role = 'employee')::integer as employees,
      count(*) filter (where role = 'admin')::integer as administrators,
      count(*) filter (where role = 'owner')::integer as owners,
      count(*) filter (where order_count > 0 or restock_count > 0)::integer as accounts_with_signal
    from base
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(p)) from page_rows p), '[]'::jsonb),
    'filteredCount', (select count(*) from filtered),
    'stats', coalesce((select to_jsonb(s) from stats s), '{}'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_users_dashboard(text,text,text,text,timestamptz,timestamptz,text,integer,integer) from public, anon;
grant execute on function public.admin_users_dashboard(text,text,text,text,timestamptz,timestamptz,text,integer,integer) to authenticated;

alter table public.order_items add column if not exists product_image_url text;

create or replace function public.snapshot_order_item_image()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_image_url is null and new.product_id is not null then
    select image.url into new.product_image_url
    from public.product_images image
    where image.product_id = new.product_id
    order by image.is_primary desc, image.sort_order, image.created_at, image.id
    limit 1;
  end if;
  return new;
end;
$$;
drop trigger if exists order_item_image_snapshot on public.order_items;
create trigger order_item_image_snapshot before insert on public.order_items for each row execute function public.snapshot_order_item_image();

create table if not exists public.guest_order_access (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.guest_order_access enable row level security;
revoke all on public.guest_order_access from public, anon, authenticated;
grant all on public.guest_order_access to service_role;

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  feedback_type text not null check (feedback_type in ('website', 'product', 'experience')),
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  rating integer check (rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_feedback_staff_queue_idx on public.customer_feedback (status, feedback_type, created_at desc);
create index if not exists customer_feedback_user_idx on public.customer_feedback (user_id, created_at desc) where user_id is not null;
grant select, update(status) on public.customer_feedback to authenticated;
grant all on public.customer_feedback to service_role;
alter table public.customer_feedback enable row level security;
create policy "customers read own feedback" on public.customer_feedback for select to authenticated using (user_id = auth.uid());
create policy "verified staff read feedback" on public.customer_feedback for select to authenticated using (public.is_staff());
create policy "verified staff update feedback" on public.customer_feedback for update to authenticated using (public.is_staff()) with check (public.is_staff());
create trigger customer_feedback_updated before update on public.customer_feedback for each row execute function public.set_updated_at();