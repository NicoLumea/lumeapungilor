-- role helpers -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin','owner')
  )
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'owner'
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('employee','admin','owner')
  )
$$;

revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_owner() from public, anon;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_staff() to authenticated;
comment on function public.is_owner() is 'Required by RLS policies; returns only whether the calling user is the owner.';
comment on function public.is_staff() is 'Required by RLS policies; returns only whether the calling user is staff.';

-- nobody may write roles from the client: no insert/update/delete policies exist
revoke insert, update, delete on public.user_roles from authenticated;
create policy "staff read roles" on public.user_roles for select to authenticated using (public.is_staff());

-- profiles ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  company_name text,
  cui text,
  reg_com text,
  billing_address text,
  delivery_address text,
  city text,
  county text,
  postal_code text,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile readable" on public.profiles for select to authenticated using (id = auth.uid());
create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer')
    on conflict (user_id, role) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- employee access requests ---------------------------------------------------
create table public.employee_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  message text,
  status text not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.employee_requests to authenticated;
grant all on public.employee_requests to service_role;
alter table public.employee_requests enable row level security;
create policy "own employee request readable" on public.employee_requests for select to authenticated using (user_id = auth.uid());
create policy "own employee request insert" on public.employee_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "admins read employee requests" on public.employee_requests for select to authenticated using (public.is_admin());
create trigger employee_requests_updated before update on public.employee_requests for each row execute function public.set_updated_at();

-- admin promotion requests ---------------------------------------------------
create table public.role_change_requests (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  candidate_email text not null,
  requested_role app_role not null,
  requested_by uuid not null,
  requester_email text,
  status text not null default 'pending_owner_approval',
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);
grant select on public.role_change_requests to authenticated;
grant all on public.role_change_requests to service_role;
alter table public.role_change_requests enable row level security;
create policy "admins read role requests" on public.role_change_requests for select to authenticated using (public.is_admin());

-- guest checkout usage (server only) -----------------------------------------
create table public.guest_checkout_usage (
  email text primary key,
  first_order_id uuid,
  first_order_at timestamptz not null default now(),
  order_count int not null default 1
);
grant all on public.guest_checkout_usage to service_role;
alter table public.guest_checkout_usage enable row level security;

-- rate limiting (server only) -------------------------------------------------
create table public.rate_limits (
  bucket text not null,
  identifier text not null,
  window_start timestamptz not null default now(),
  hits int not null default 1,
  primary key (bucket, identifier)
);
grant all on public.rate_limits to service_role;
alter table public.rate_limits enable row level security;

-- returns / complaints ---------------------------------------------------------
create table public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  user_id uuid,
  email text not null,
  kind text not null default 'retur',
  message text not null,
  status text not null default 'nou',
  resolution text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.return_requests to authenticated;
grant all on public.return_requests to service_role;
alter table public.return_requests enable row level security;
create policy "own returns readable" on public.return_requests for select to authenticated using (user_id is not null and user_id = auth.uid());
create policy "own returns insert" on public.return_requests for insert to authenticated with check (user_id = auth.uid());
create policy "staff read returns" on public.return_requests for select to authenticated using (public.is_staff());
create policy "staff update returns" on public.return_requests for update to authenticated using (public.is_staff()) with check (public.is_staff());
create trigger return_requests_updated before update on public.return_requests for each row execute function public.set_updated_at();

-- contact requests --------------------------------------------------------------
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'nou',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.contact_requests to authenticated;
grant all on public.contact_requests to service_role;
alter table public.contact_requests enable row level security;
create policy "own messages readable" on public.contact_requests for select to authenticated using (user_id is not null and user_id = auth.uid());
create policy "staff read messages" on public.contact_requests for select to authenticated using (public.is_staff());
create policy "staff update messages" on public.contact_requests for update to authenticated using (public.is_staff()) with check (public.is_staff());
create trigger contact_requests_updated before update on public.contact_requests for each row execute function public.set_updated_at();

-- operational settings -----------------------------------------------------------
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public reads public settings" on public.site_settings for select to anon, authenticated using (is_public);
create policy "staff read settings" on public.site_settings for select to authenticated using (public.is_staff());
create policy "admins manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger site_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();
insert into public.site_settings (key, value, is_public) values
  ('guest_cart_max_distinct_products', '{"value":3}'::jsonb, true);

-- editable content with draft/publish ----------------------------------------------
create table public.content_sections (
  key text primary key,
  draft jsonb not null default '{}'::jsonb,
  published jsonb,
  updated_by uuid,
  published_by uuid,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
grant select on public.content_sections to anon, authenticated;
grant insert, update on public.content_sections to authenticated;
grant all on public.content_sections to service_role;
alter table public.content_sections enable row level security;
create policy "public reads published sections" on public.content_sections for select to anon, authenticated using (published is not null);
create policy "staff read sections" on public.content_sections for select to authenticated using (public.is_staff());
create policy "staff edit drafts" on public.content_sections for insert to authenticated with check (public.is_staff());
create policy "staff update drafts" on public.content_sections for update to authenticated using (public.is_staff()) with check (public.is_staff());
create trigger content_sections_updated before update on public.content_sections for each row execute function public.set_updated_at();

-- immutable audit log -----------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant insert, select on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.is_admin());

create or replace function public.block_audit_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Audit records are immutable';
end; $$;
create trigger audit_logs_no_update before update on public.audit_logs for each row execute function public.block_audit_mutation();
create trigger audit_logs_no_delete before delete on public.audit_logs for each row execute function public.block_audit_mutation();

create or replace function public.write_audit(_action text, _entity text, _entity_id text, _details jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), _action, _entity, _entity_id, coalesce(_details, '{}'::jsonb));
end; $$;
revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;

-- automatic audit triggers -------------------------------------------------------------
create or replace function public.audit_product_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'product.created', 'products', new.id::text, jsonb_build_object('name', new.name));
  elsif tg_op = 'UPDATE' then
    if new.price is distinct from old.price then
      insert into public.audit_logs (actor_id, action, entity, entity_id, details)
      values (auth.uid(), 'product.price_changed', 'products', new.id::text,
              jsonb_build_object('from', old.price, 'to', new.price));
    end if;
    if new.stock is distinct from old.stock then
      insert into public.audit_logs (actor_id, action, entity, entity_id, details)
      values (auth.uid(), 'product.stock_changed', 'products', new.id::text,
              jsonb_build_object('from', old.stock, 'to', new.stock));
    end if;
    if new.status is distinct from old.status or new.is_archived is distinct from old.is_archived then
      insert into public.audit_logs (actor_id, action, entity, entity_id, details)
      values (auth.uid(), 'product.status_changed', 'products', new.id::text,
              jsonb_build_object('status', new.status, 'archived', new.is_archived));
    end if;
  end if;
  return new;
end; $$;
create trigger products_audit after insert or update on public.products
  for each row execute function public.audit_product_change();

create or replace function public.audit_order_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    insert into public.audit_logs (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'order.status_changed', 'orders', new.id::text,
            jsonb_build_object('status', new.status, 'payment_status', new.payment_status));
  end if;
  return new;
end; $$;
create trigger orders_audit after update on public.orders
  for each row execute function public.audit_order_change();

create or replace function public.audit_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(),
          case when tg_op = 'DELETE' then 'role.revoked' else 'role.granted' end,
          'user_roles',
          coalesce(new.user_id, old.user_id)::text,
          jsonb_build_object('role', coalesce(new.role, old.role)));
  return coalesce(new, old);
end; $$;
create trigger user_roles_audit after insert or delete on public.user_roles
  for each row execute function public.audit_role_change();

-- orders: guest tracking + archival ------------------------------------------------------
alter table public.orders
  add column if not exists is_guest boolean not null default true,
  add column if not exists email_verified boolean not null default false,
  add column if not exists archived_at timestamptz;

-- staff (employee) operational access -----------------------------------------------------
create policy "staff read all orders" on public.orders for select to authenticated using (public.is_staff());
create policy "staff update orders" on public.orders for update to authenticated using (public.is_staff()) with check (public.is_staff());
grant update on public.orders to authenticated;

create policy "staff read all order items" on public.order_items for select to authenticated using (public.is_staff());

create policy "staff manage products" on public.products for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage categories" on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage images" on public.product_images for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage variants" on public.product_variants for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage content" on public.site_content for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "staff upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_staff());
create policy "staff update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_staff());