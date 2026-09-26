-- Preserve the existing product_images model while making gallery order and
-- primary-image selection reliable and atomic.

alter table public.product_images
  add column if not exists updated_at timestamptz not null default now();

-- Match the order customers currently see: explicit primary first, followed by
-- the previous sort order. No image rows or storage objects are removed.
with ranked as (
  select
    id,
    row_number() over (
      partition by product_id
      order by is_primary desc, sort_order, created_at, id
    )::integer - 1 as new_sort_order,
    row_number() over (
      partition by product_id
      order by is_primary desc, sort_order, created_at, id
    ) = 1 as new_is_primary
  from public.product_images
)
update public.product_images image
set
  sort_order = ranked.new_sort_order,
  is_primary = ranked.new_is_primary
from ranked
where image.id = ranked.id;

create index if not exists product_images_gallery_order_idx
  on public.product_images(product_id, sort_order, created_at, id);

create unique index if not exists product_images_one_primary_idx
  on public.product_images(product_id)
  where is_primary;

alter table public.product_images
  drop constraint if exists product_images_sort_order_nonnegative;
alter table public.product_images
  add constraint product_images_sort_order_nonnegative check (sort_order >= 0);

drop trigger if exists product_images_updated on public.product_images;
create trigger product_images_updated
  before update on public.product_images
  for each row execute function public.set_updated_at();

create or replace function public.repair_product_image_gallery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  -- The first inserted image becomes primary. If the primary image is deleted,
  -- the first remaining image becomes primary and the order is compacted.
  if not exists (
    select 1 from public.product_images
    where product_id = target_product_id and is_primary
  ) then
    update public.product_images
    set is_primary = true
    where id = (
      select id from public.product_images
      where product_id = target_product_id
      order by sort_order, created_at, id
      limit 1
    );
  end if;

  if tg_op = 'DELETE' then
    with ranked as (
      select id, row_number() over (order by sort_order, created_at, id)::integer - 1 as new_sort_order
      from public.product_images
      where product_id = target_product_id
    )
    update public.product_images image
    set sort_order = ranked.new_sort_order
    from ranked
    where image.id = ranked.id;
  end if;

  return null;
end;
$$;

revoke execute on function public.repair_product_image_gallery() from public, anon, authenticated;

drop trigger if exists product_images_repair_gallery on public.product_images;
create trigger product_images_repair_gallery
  after insert or delete on public.product_images
  for each row execute function public.repair_product_image_gallery();

create or replace function public.update_product_image_gallery(
  p_product_id uuid,
  p_image_ids uuid[],
  p_primary_image_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected_count integer;
begin
  if not public.is_staff() then
    raise exception 'Only authorized staff may update product images';
  end if;

  select count(*) into expected_count
  from public.product_images
  where product_id = p_product_id;

  if coalesce(cardinality(p_image_ids), 0) <> expected_count
    or (
      select count(distinct submitted.image_id)
      from unnest(coalesce(p_image_ids, array[]::uuid[])) as submitted(image_id)
    ) <> expected_count then
    raise exception 'The submitted gallery does not match the stored product images';
  end if;

  if expected_count > 0 and (p_primary_image_id is null or not p_primary_image_id = any(p_image_ids)) then
    raise exception 'The primary image must belong to the product gallery';
  end if;

  update public.product_images
  set is_primary = false
  where product_id = p_product_id and is_primary;

  update public.product_images image
  set
    sort_order = ordered.position::integer - 1,
    is_primary = image.id = p_primary_image_id
  from unnest(coalesce(p_image_ids, array[]::uuid[])) with ordinality as ordered(image_id, position)
  where image.product_id = p_product_id
    and image.id = ordered.image_id;
end;
$$;

revoke execute on function public.update_product_image_gallery(uuid, uuid[], uuid) from public, anon;
grant execute on function public.update_product_image_gallery(uuid, uuid[], uuid) to authenticated;

comment on function public.update_product_image_gallery(uuid, uuid[], uuid) is
  'Atomically persists a complete ordered product gallery and its primary image for authorized staff.';
