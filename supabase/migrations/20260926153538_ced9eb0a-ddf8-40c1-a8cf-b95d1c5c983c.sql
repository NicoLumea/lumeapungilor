drop policy if exists "staff read profiles" on public.profiles;
drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles
  for select to authenticated
  using (public.is_admin());

create index if not exists orders_user_activity_idx
  on public.orders (user_id, created_at desc)
  where user_id is not null and is_test = false;
create index if not exists orders_email_activity_idx
  on public.orders (lower(email), created_at desc)
  where is_test = false;
create index if not exists restock_requests_email_activity_idx
  on public.restock_requests (lower(email), created_at desc);

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
  if _role is not null and _role not in ('customer', 'employee', 'admin') then
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
      case when bool_or(ur.role in ('admin', 'owner')) then 'admin'
           when bool_or(ur.role = 'employee') then 'employee'
           else 'customer' end as account_role
    from public.user_roles ur group by ur.user_id
  ), order_rollup as (
    select o.user_id, count(*)::integer as order_count, max(o.created_at) as latest_order_at
    from public.orders o where o.user_id is not null and o.is_test = false group by o.user_id
  ), restock_rollup as (
    select lower(r.email) as email, count(*)::integer as restock_count, max(r.created_at) as latest_restock_at
    from public.restock_requests r group by lower(r.email)
  ), base as (
    select u.id, u.email, coalesce(rr.account_role, 'customer') as role, u.created_at,
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

create or replace function public.admin_interest_dashboard(
  _search text default null, _source text default null, _date_from timestamptz default null,
  _date_to timestamptz default null, _page integer default 1, _page_size integer default 25
)
returns jsonb language plpgsql stable security definer set search_path = public, auth
as $$
declare result jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if _source is not null and _source not in ('account', 'order', 'restock') then
    raise exception 'INVALID_SOURCE' using errcode = '22023';
  end if;

  with events as (
    select 'account-' || u.id::text as id, u.email, 'account'::text as source,
      'Cont înregistrat'::text as source_label, null::text as summary,
      u.created_at as activity_at, null::text as order_status
    from auth.users u where u.deleted_at is null and u.email is not null
    union all
    select 'order-' || o.id::text, o.email, 'order', 'A plasat comandă',
      coalesce(items.summary, 'Comanda ' || o.order_number), o.created_at, o.status
    from public.orders o
    left join lateral (
      select string_agg(oi.product_name || ' × ' || oi.quantity::text, ', ' order by oi.product_name) as summary
      from public.order_items oi where oi.order_id = o.id
    ) items on true
    where o.is_test = false and o.email is not null
    union all
    select 'restock-' || r.id::text, r.email, 'restock', 'Cerere revenire în stoc',
      concat_ws(' · ', p.name, pv.name), r.created_at, r.status
    from public.restock_requests r
    join public.products p on p.id = r.product_id
    left join public.product_variants pv on pv.id = r.variant_id
  ), filtered as (
    select * from events e
    where (_search is null or e.email ilike '%' || trim(_search) || '%')
      and (_source is null or e.source = _source)
      and (_date_from is null or e.activity_at >= _date_from)
      and (_date_to is null or e.activity_at < _date_to)
  ), page_rows as (
    select * from filtered order by activity_at desc, id
    offset (greatest(_page, 1) - 1) * least(greatest(_page_size, 1), 100)
    limit least(greatest(_page_size, 1), 100)
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(p)) from page_rows p), '[]'::jsonb),
    'filteredCount', (select count(*) from filtered)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_interest_dashboard(text,text,timestamptz,timestamptz,integer,integer) from public, anon;
grant execute on function public.admin_interest_dashboard(text,text,timestamptz,timestamptz,integer,integer) to authenticated;

create or replace function public.admin_users_export(
  _search text default null, _role text default null, _source text default null, _status text default null,
  _date_from timestamptz default null, _date_to timestamptz default null, _sort text default 'newest'
)
returns jsonb language plpgsql volatile security definer set search_path = public, auth
as $$
declare payload jsonb; exported_rows integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  payload := public.admin_users_dashboard(_search, _role, _source, _status, _date_from, _date_to, _sort, 1, 100);
  exported_rows := jsonb_array_length(payload->'rows');

  insert into public.audit_logs (actor_id, actor_email, action, entity, details)
  select auth.uid(), u.email, 'accounts.csv_exported', 'admin_users_dashboard',
    jsonb_build_object(
      'row_count', exported_rows,
      'filtered_count', payload->'filteredCount',
      'filters', jsonb_build_object('search', _search, 'role', _role, 'source', _source, 'status', _status,
        'date_from', _date_from, 'date_to', _date_to, 'sort', _sort),
      'truncated', ((payload->>'filteredCount')::integer > exported_rows))
  from auth.users u where u.id = auth.uid();

  return jsonb_build_object('rows', payload->'rows', 'rowCount', exported_rows,
    'truncated', ((payload->>'filteredCount')::integer > exported_rows));
end;
$$;

revoke all on function public.admin_users_export(text,text,text,text,timestamptz,timestamptz,text) from public, anon;
grant execute on function public.admin_users_export(text,text,text,text,timestamptz,timestamptz,text) to authenticated;

insert into public.site_settings (key, value, is_public) values (
  'account_activity_retention',
  '{"status":"requires_business_and_legal_review","account_data_months":null,"login_timestamp_months":null,"saved_cart_months":null,"restock_request_months":null,"order_records_note":"Păstrați conform obligațiilor legale confirmate ale firmei; perioada nu este încă stabilită."}'::jsonb,
  false
) on conflict (key) do nothing;

update public.site_content
set value = jsonb_build_object(
  'title', 'Confidențialitate',
  'body', E'DATE PRELUCRATE PENTRU CONT ȘI SERVICII\n\nPentru funcționarea contului și administrarea serviciului putem prelucra adresa de e-mail a contului, data creării contului, starea confirmării adresei, momentele autentificărilor, comenzile asociate, coșurile salvate atunci când această funcție este disponibilă și cererile de notificare privind revenirea produselor în stoc.\n\nSCOPURI\n\nFolosim aceste date pentru operarea contului, gestionarea comenzilor, asistență pentru clienți, securitate, prevenirea abuzurilor și administrarea serviciului. Crearea unui cont, plasarea unei comenzi sau solicitarea unei notificări de stoc nu reprezintă consimțământ pentru marketing. Nu folosim aceste adrese pentru mesaje promoționale fără un consimțământ de marketing separat și valabil.\n\nACCES ȘI SECURITATE\n\nAccesul la evidența centralizată a conturilor și semnalelor comerciale este limitat la administratori autorizați. Angajații primesc acces numai la datele operaționale necesare atribuțiilor lor, conform drepturilor configurate. Nu afișăm parole, tokenuri de autentificare sau date de plată în această evidență.\n\nPĂSTRAREA DATELOR\n\nDatele despre cont și activitate nu trebuie păstrate pe termen nelimitat fără un motiv de afaceri documentat. Perioadele pentru conturi inactive, momente de autentificare, coșuri salvate și cereri de stoc trebuie confirmate de firmă și de consilierul juridic. Documentele și istoricul comenzilor se păstrează potrivit obligațiilor legale confirmate ale firmei.\n\nDE REVIZUIT DE COMPANIE/CONSILIER JURIDIC înainte de publicare: temeiurile juridice aplicabile, perioadele exacte de păstrare, destinatarii datelor, furnizorii împuterniciți, transferurile internaționale și procedura completă pentru exercitarea drepturilor persoanelor vizate.'
), updated_at = now()
where key = 'privacy' and nullif(trim(coalesce(value->>'body', '')), '') is null;

comment on function public.admin_users_dashboard(text,text,text,text,timestamptz,timestamptz,text,integer,integer)
  is 'Admin-only, filtered and paginated account projection. Never returns auth credentials or tokens.';
comment on function public.admin_interest_dashboard(text,text,timestamptz,timestamptz,integer,integer)
  is 'Admin-only factual purchase-interest events from account creation, submitted orders and restock requests.';