-- Forward-only correction: historical staff-wide policies remain permissive
-- even after admin-only policies were added. RLS policies are OR-combined.
-- Keep employee access to operational orders/returns, but require the trusted
-- admin/owner role plus the verified Supabase session for catalog and content.

drop policy if exists "staff manage products" on public.products;
drop policy if exists "staff manage categories" on public.categories;
drop policy if exists "staff manage images" on public.product_images;
drop policy if exists "staff manage variants" on public.product_variants;
drop policy if exists "staff manage content" on public.site_content;
drop policy if exists "staff upload product images" on storage.objects;
drop policy if exists "staff update product images" on storage.objects;

-- Recreate the canonical policies so this migration is safe when older
-- environments have only some of the historical policies installed.
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage images" on public.product_images;
create policy "admins manage images" on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage variants" on public.product_variants;
create policy "admins manage variants" on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage content" on public.site_content;
create policy "admins manage content" on public.site_content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- The private product-images bucket is served to the storefront through the
-- application's image endpoint. Direct object access remains admin-only.
drop policy if exists "admins read product images" on storage.objects;
create policy "admins read product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Product gallery RPC should enforce the same role as direct RLS writes.
create or replace function public.update_product_image_gallery(
  p_product_id uuid, p_image_ids uuid[], p_primary_image_id uuid
)
returns void language plpgsql security invoker set search_path = public as $$
declare expected_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  select count(*) into expected_count from public.product_images where product_id = p_product_id;
  if coalesce(cardinality(p_image_ids), 0) <> expected_count
    or (select count(distinct image_id)
        from unnest(coalesce(p_image_ids, array[]::uuid[])) as submitted(image_id)) <> expected_count then
    raise exception 'The submitted gallery does not match the stored product images';
  end if;
  if expected_count > 0
    and (p_primary_image_id is null or not p_primary_image_id = any(p_image_ids)) then
    raise exception 'The primary image must belong to the product gallery';
  end if;
  update public.product_images set is_primary = false
  where product_id = p_product_id and is_primary;
  update public.product_images image
  set sort_order = ordered.position::integer - 1,
      is_primary = image.id = p_primary_image_id
  from unnest(coalesce(p_image_ids, array[]::uuid[])) with ordinality
    as ordered(image_id, position)
  where image.product_id = p_product_id and image.id = ordered.image_id;
end;
$$;
revoke all on function public.update_product_image_gallery(uuid, uuid[], uuid) from public, anon;
grant execute on function public.update_product_image_gallery(uuid, uuid[], uuid) to authenticated;
