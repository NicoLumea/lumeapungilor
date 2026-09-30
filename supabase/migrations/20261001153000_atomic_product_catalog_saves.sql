-- Persist a product and its gallery/variants in one database transaction. The
-- function is security-invoker and keeps all existing RLS checks in force.

create or replace function public.save_product_catalog_entry(
  p_product_id uuid,
  p_product jsonb,
  p_images jsonb default '[]'::jsonb,
  p_variants jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  saved_product_id uuid;
  image_entry record;
  image_id uuid;
  primary_image_id uuid;
  variant_entry record;
begin
  if auth.uid() is null or not public.is_staff() then
    raise exception 'STAFF_REQUIRED' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_product, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_images, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_variants, '[]'::jsonb)) <> 'array' then
    raise exception 'INVALID_PRODUCT_PAYLOAD' using errcode = '22023';
  end if;
  if nullif(btrim(p_product->>'name'), '') is null
    or nullif(btrim(p_product->>'slug'), '') is null then
    raise exception 'PRODUCT_NAME_AND_SLUG_REQUIRED' using errcode = '22023';
  end if;
  if p_product->>'status' not in ('draft', 'published') then
    raise exception 'INVALID_PRODUCT_STATUS' using errcode = '22023';
  end if;
  if (p_product->>'price')::numeric < 0
    or (p_product->>'stock')::integer < 0
    or (p_product->>'min_order_qty')::integer < 1
    or (p_product->>'qty_increment')::integer < 1 then
    raise exception 'INVALID_PRODUCT_NUMBERS' using errcode = '22023';
  end if;

  if p_product_id is null then
    insert into public.products (
      name, slug, description, category_id, sku, price, selling_unit, units_per_pack,
      min_order_qty, qty_increment, stock, track_stock, status, is_featured,
      is_archived, sort_order, specs
    ) values (
      btrim(p_product->>'name'), lower(btrim(p_product->>'slug')),
      nullif(btrim(p_product->>'description'), ''), nullif(p_product->>'category_id', '')::uuid,
      nullif(btrim(p_product->>'sku'), ''), (p_product->>'price')::numeric,
      coalesce(nullif(btrim(p_product->>'selling_unit'), ''), 'set'),
      nullif(p_product->>'units_per_pack', '')::integer,
      (p_product->>'min_order_qty')::integer, (p_product->>'qty_increment')::integer,
      (p_product->>'stock')::integer, (p_product->>'track_stock')::boolean,
      p_product->>'status', (p_product->>'is_featured')::boolean,
      (p_product->>'is_archived')::boolean, (p_product->>'sort_order')::integer,
      coalesce(p_product->'specs', '[]'::jsonb)
    ) returning id into saved_product_id;
  else
    update public.products set
      name = btrim(p_product->>'name'),
      slug = lower(btrim(p_product->>'slug')),
      description = nullif(btrim(p_product->>'description'), ''),
      category_id = nullif(p_product->>'category_id', '')::uuid,
      sku = nullif(btrim(p_product->>'sku'), ''),
      price = (p_product->>'price')::numeric,
      selling_unit = coalesce(nullif(btrim(p_product->>'selling_unit'), ''), 'set'),
      units_per_pack = nullif(p_product->>'units_per_pack', '')::integer,
      min_order_qty = (p_product->>'min_order_qty')::integer,
      qty_increment = (p_product->>'qty_increment')::integer,
      stock = (p_product->>'stock')::integer,
      track_stock = (p_product->>'track_stock')::boolean,
      status = p_product->>'status',
      is_featured = (p_product->>'is_featured')::boolean,
      is_archived = (p_product->>'is_archived')::boolean,
      sort_order = (p_product->>'sort_order')::integer,
      specs = coalesce(p_product->'specs', '[]'::jsonb)
    where id = p_product_id
    returning id into saved_product_id;
    if saved_product_id is null then
      raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) submitted
    where nullif(submitted->>'id', '') is not null
      and not exists (
        select 1 from public.product_images stored
        where stored.id = (submitted->>'id')::uuid
          and stored.product_id = saved_product_id
      )
  ) then
    raise exception 'INVALID_PRODUCT_IMAGE' using errcode = '22023';
  end if;
  if (
    select count(*)
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) submitted
    where nullif(submitted->>'id', '') is not null
  ) <> (
    select count(distinct submitted->>'id')
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) submitted
    where nullif(submitted->>'id', '') is not null
  ) then
    raise exception 'DUPLICATE_PRODUCT_IMAGE' using errcode = '22023';
  end if;

  update public.product_images set is_primary = false where product_id = saved_product_id;
  delete from public.product_images stored
  where stored.product_id = saved_product_id
    and stored.id not in (
      select (submitted->>'id')::uuid
      from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) submitted
      where nullif(submitted->>'id', '') is not null
    );
  update public.product_images set is_primary = false where product_id = saved_product_id;

  for image_entry in
    select submitted, position
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) with ordinality
      as gallery(submitted, position)
    order by position
  loop
    if nullif(image_entry.submitted->>'id', '') is null then
      if nullif(btrim(image_entry.submitted->>'url'), '') is null then
        raise exception 'INVALID_PRODUCT_IMAGE_URL' using errcode = '22023';
      end if;
      insert into public.product_images (product_id, url, alt, sort_order, is_primary)
      values (
        saved_product_id,
        btrim(image_entry.submitted->>'url'),
        nullif(btrim(image_entry.submitted->>'alt'), ''),
        image_entry.position::integer - 1,
        false
      ) returning id into image_id;
    else
      image_id := (image_entry.submitted->>'id')::uuid;
      update public.product_images set
        alt = nullif(btrim(image_entry.submitted->>'alt'), ''),
        sort_order = image_entry.position::integer - 1
      where id = image_id and product_id = saved_product_id;
    end if;
    if coalesce((image_entry.submitted->>'is_primary')::boolean, false) then
      if primary_image_id is not null then
        raise exception 'MULTIPLE_PRIMARY_IMAGES' using errcode = '22023';
      end if;
      primary_image_id := image_id;
    end if;
  end loop;

  -- The gallery repair trigger may promote the first newly inserted image.
  -- Clear that temporary choice before applying the submitted primary image.
  update public.product_images set is_primary = false where product_id = saved_product_id;
  if primary_image_id is null then
    select id into primary_image_id from public.product_images
    where product_id = saved_product_id
    order by sort_order, created_at, id
    limit 1;
  end if;
  if primary_image_id is not null then
    update public.product_images set is_primary = true
    where id = primary_image_id and product_id = saved_product_id;
  end if;

  delete from public.product_variants where product_id = saved_product_id;
  for variant_entry in
    select submitted, position
    from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) with ordinality
      as choices(submitted, position)
    order by position
  loop
    if nullif(btrim(variant_entry.submitted->>'name'), '') is null
      or (variant_entry.submitted->>'stock')::integer < 0
      or (
        nullif(variant_entry.submitted->>'price', '') is not null
        and (variant_entry.submitted->>'price')::numeric < 0
      ) then
      raise exception 'INVALID_PRODUCT_VARIANT' using errcode = '22023';
    end if;
    insert into public.product_variants (product_id, name, sku, price, stock, sort_order)
    values (
      saved_product_id,
      btrim(variant_entry.submitted->>'name'),
      nullif(btrim(variant_entry.submitted->>'sku'), ''),
      nullif(variant_entry.submitted->>'price', '')::numeric,
      (variant_entry.submitted->>'stock')::integer,
      variant_entry.position::integer - 1
    );
  end loop;

  return saved_product_id;
end;
$$;

revoke all on function public.save_product_catalog_entry(uuid, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_product_catalog_entry(uuid, jsonb, jsonb, jsonb)
  to authenticated;

comment on function public.save_product_catalog_entry(uuid, jsonb, jsonb, jsonb) is
  'Atomically saves an authorized staff product, gallery metadata, and variants under RLS.';

-- Bring the restock queue under the same canonical staff-session rule as the
-- rest of the operational dashboard. Admin/Owner sessions pass is_staff()
-- directly; Employee-only sessions retain their email verification boundary.
drop policy if exists "Staff can read restock requests" on public.restock_requests;
drop policy if exists "Staff can update restock requests" on public.restock_requests;
create policy "Staff can read restock requests" on public.restock_requests
  for select to authenticated using (public.is_staff());
create policy "Staff can update restock requests" on public.restock_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
