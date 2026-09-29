-- Global site content is an administrative concern, not a general staff capability.
drop policy if exists "staff manage content" on public.site_content;
drop policy if exists "admins manage content" on public.site_content;
create policy "admins manage content" on public.site_content
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "staff read sections" on public.content_sections;
drop policy if exists "staff edit drafts" on public.content_sections;
drop policy if exists "staff update drafts" on public.content_sections;
drop policy if exists "admins manage sections" on public.content_sections;
create policy "admins manage sections" on public.content_sections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The baseline customer role describes the shopping account. The effective
-- system role is reported separately and uses the highest assigned privilege.
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

comment on function public.admin_users_dashboard(text,text,text,text,timestamptz,timestamptz,text,integer,integer)
  is 'Admin-only account projection with separate shopping account type and highest effective system role.';
