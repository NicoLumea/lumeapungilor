-- Category order is optional metadata. Existing memberships and products stay intact.
alter table public.product_categories
  add column if not exists sort_order integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_categories'::regclass
      and conname = 'product_categories_sort_order_nonnegative'
  ) then
    alter table public.product_categories
      add constraint product_categories_sort_order_nonnegative
      check (sort_order is null or sort_order >= 0);
  end if;
end;
$$;

-- Repeat the legacy primary-category backfill safely for databases that missed earlier rows.
insert into public.product_categories (product_id, category_id)
select id, category_id from public.products where category_id is not null
on conflict do nothing;

create index if not exists product_categories_default_order_idx
  on public.product_categories (category_id, sort_order asc nulls last, created_at, product_id);

-- Keep writes restricted to authorized staff; public catalogue access remains SELECT-only.
grant update (sort_order) on public.product_categories to authenticated;
drop policy if exists "staff update product category order" on public.product_categories;
create policy "staff update product category order" on public.product_categories
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.reorder_category_products(
  p_category_id uuid,
  p_product_ids uuid[]
) returns void language plpgsql security invoker set search_path = public as $$
declare
  v_count integer;
begin
  if not public.is_staff() then
    raise exception 'Only authorized staff may reorder category products' using errcode = '42501';
  end if;
  if p_category_id is null or p_product_ids is null or array_position(p_product_ids, null) is not null then
    raise exception 'Invalid category or product list' using errcode = '22023';
  end if;

  -- Serialize reorders for this category, including an empty category.
  perform 1 from public.categories where id = p_category_id for update;
  if not found then
    raise exception 'Category not found or inaccessible' using errcode = 'P0002';
  end if;

  select count(*) into v_count
  from public.product_categories where category_id = p_category_id;
  if cardinality(p_product_ids) <> v_count
    or (select count(distinct id) from unnest(p_product_ids) as ids(id)) <> v_count
    or exists (
      select 1 from unnest(p_product_ids) as ids(id)
      where not exists (
        select 1 from public.product_categories pc
        where pc.category_id = p_category_id and pc.product_id = ids.id
      )
    ) then
    raise exception 'Category membership changed; reload before saving order' using errcode = '22023';
  end if;

  update public.product_categories pc
  set sort_order = ordered.position - 1
  from unnest(p_product_ids) with ordinality as ordered(product_id, position)
  where pc.category_id = p_category_id and pc.product_id = ordered.product_id;
end;
$$;

revoke all on function public.reorder_category_products(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_category_products(uuid, uuid[]) to authenticated;
