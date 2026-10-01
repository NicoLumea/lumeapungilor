-- Keep products.category_id as the primary/breadcrumb category. Membership lives here.
create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index product_categories_category_id_idx on public.product_categories (category_id, product_id);

-- Existing products retain their current category without touching product, order or stock rows.
insert into public.product_categories (product_id, category_id)
select id, category_id from public.products where category_id is not null
on conflict do nothing;

grant select on public.product_categories to anon;
grant select, insert, delete on public.product_categories to authenticated;
grant all on public.product_categories to service_role;
alter table public.product_categories enable row level security;

create policy "public reads browsable product categories" on public.product_categories
for select to anon, authenticated using (
  public.is_staff() or (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published' and not p.is_archived)
    and exists (select 1 from public.categories c where c.id = category_id and c.is_visible)
  )
);
create policy "staff insert product categories" on public.product_categories
for insert to authenticated with check (public.is_staff());
create policy "staff delete product categories" on public.product_categories
for delete to authenticated using (public.is_staff());

-- Replace only memberships, atomically. A primary category must be one of them.
create function public.set_product_categories(
  p_product_id uuid,
  p_category_ids uuid[],
  p_primary_category_id uuid
) returns void language plpgsql security invoker set search_path = public as $$
declare
  v_ids uuid[];
begin
  if not public.is_staff() then
    raise exception 'Only authorized staff may manage product categories' using errcode = '42501';
  end if;

  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Product not found or inaccessible' using errcode = 'P0002';
  end if;

  if p_category_ids is null or array_position(p_category_ids, null) is not null then
    raise exception 'Invalid category list' using errcode = '22023';
  end if;
  select coalesce(array_agg(id), '{}'::uuid[]) into v_ids
  from (select distinct unnest(p_category_ids) as id) selected;

  if p_primary_category_id is not null and not (p_primary_category_id = any(v_ids)) then
    raise exception 'Primary category must be assigned' using errcode = '22023';
  end if;
  if cardinality(v_ids) <> (
    select count(*) from public.categories where id = any(v_ids)
  ) then
    raise exception 'Unknown or inaccessible category' using errcode = '22023';
  end if;

  update public.products set category_id = p_primary_category_id where id = p_product_id;
  delete from public.product_categories
  where product_id = p_product_id and not (category_id = any(v_ids));
  insert into public.product_categories (product_id, category_id)
  select p_product_id, unnest(v_ids)
  on conflict do nothing;
end;
$$;

revoke all on function public.set_product_categories(uuid, uuid[], uuid) from public, anon;
grant execute on function public.set_product_categories(uuid, uuid[], uuid) to authenticated;
