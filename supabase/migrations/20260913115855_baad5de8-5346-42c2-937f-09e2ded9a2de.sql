create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public reads visible categories" on public.categories for select to anon, authenticated using (is_visible or public.is_admin());
create policy "admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  sku text,
  price numeric(12,2) not null default 0,
  currency text not null default 'RON',
  selling_unit text not null default 'set',
  units_per_pack int,
  min_order_qty int not null default 1,
  qty_increment int not null default 1,
  stock int not null default 0,
  track_stock boolean not null default true,
  status text not null default 'draft',
  is_featured boolean not null default false,
  is_archived boolean not null default false,
  sort_order int not null default 0,
  specs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public reads published products" on public.products for select to anon, authenticated using ((status = 'published' and not is_archived) or public.is_admin());
create policy "admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create index products_category_idx on public.products(category_id);

-- images
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.product_images to anon;
grant select, insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "public reads images of readable products" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and ((p.status = 'published' and not p.is_archived) or public.is_admin())));
create policy "admins manage images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create index product_images_product_idx on public.product_images(product_id);

-- variants
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price numeric(12,2),
  stock int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.product_variants to anon;
grant select, insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "public reads variants of readable products" on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and ((p.status = 'published' and not p.is_archived) or public.is_admin())));
create policy "admins manage variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- site content
create table public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_content to anon;
grant select, insert, update, delete on public.site_content to authenticated;
grant all on public.site_content to service_role;
alter table public.site_content enable row level security;
create policy "public reads content" on public.site_content for select to anon, authenticated using (true);
create policy "admins manage content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger site_content_updated before update on public.site_content for each row execute function public.set_updated_at();

-- orders
create sequence public.order_number_seq start 1000;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('LP-' || nextval('public.order_number_seq')::text),
  user_id uuid,
  email text not null,
  phone text,
  contact_name text not null,
  company_name text,
  cui text,
  reg_com text,
  billing_address text,
  delivery_address text,
  city text,
  county text,
  postal_code text,
  notes text,
  internal_notes text,
  status text not null default 'nou',
  payment_status text not null default 'neplatit',
  payment_reference text unique,
  subtotal numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'RON',
  is_test boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "customers read own orders" on public.orders for select to authenticated using (user_id is not null and user_id = auth.uid());
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  variant_name text,
  sku text,
  selling_unit text,
  units_per_pack int,
  quantity int not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "admins manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "customers read own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- initial categories + content
insert into public.categories (slug, name, description, sort_order) values
  ('pungi-plastic', 'Pungi de plastic', null, 1),
  ('pungi-hartie', 'Pungi de hârtie', null, 2),
  ('fete-de-masa', 'Fețe de masă', null, 3),
  ('folie-cu-bule', 'Folie cu bule', null, 4);

insert into public.site_content (key, value) values
  ('company', '{"name":"Lumea Pungilor","logo_url":null,"email":null,"phone":null,"address":null,"cui":null,"reg_com":null,"facebook":null,"instagram":null,"footer_text":null}'::jsonb),
  ('home', '{"hero_title":"Ambalaje pentru afacerea ta","hero_subtitle":"Pungi de plastic, pungi de hârtie, fețe de masă și folie cu bule.","hero_image_url":null,"cta_label":"Vezi catalogul","cta_href":"/produse","editorial_title":null,"editorial_body":null,"editorial_image_url":null}'::jsonb),
  ('about', '{"title":"Despre noi","body":null,"image_url":null}'::jsonb),
  ('contact', '{"title":"Contact","body":null}'::jsonb),
  ('shipping', '{"title":"Livrare","body":null}'::jsonb),
  ('returns', '{"title":"Retur","body":null}'::jsonb),
  ('terms', '{"title":"Termeni și condiții","body":null}'::jsonb),
  ('privacy', '{"title":"Confidențialitate","body":null}'::jsonb),
  ('settings', '{"shipping_flat":null,"free_shipping_over":null,"vat_rate":null,"payments_configured":false}'::jsonb);