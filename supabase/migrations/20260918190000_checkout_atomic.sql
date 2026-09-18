-- Checkout is executed by the trusted server with the service role. A single
-- function call is one PostgreSQL transaction, including stock and guest usage.
alter table public.orders
  add column if not exists checkout_hash text,
  add column if not exists confirmation_token uuid not null default gen_random_uuid(),
  add column if not exists billing_city text,
  add column if not exists billing_county text,
  add column if not exists billing_postal_code text,
  add column if not exists delivery_instructions text,
  add column if not exists vat_rate numeric(5,2),
  add column if not exists prices_include_vat boolean;

create unique index if not exists orders_confirmation_token_idx
  on public.orders(confirmation_token);

alter table public.order_items
  add column if not exists vat_rate numeric(5,2),
  add column if not exists vat_total numeric(12,2);

update public.site_content
set value = '{"prices_include_vat":null,"shipping_taxable":null}'::jsonb || value
where key = 'settings';

create or replace function public.checkout_place(
  p_lines jsonb,
  p_customer jsonb,
  p_user_id uuid,
  p_idempotency_key uuid,
  p_expected_total numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  settings jsonb;
  guest_settings jsonb;
  previous_order public.orders%rowtype;
  placed_order public.orders%rowtype;
  seen text[] := '{}';
  line_key text;
  line_qty integer;
  unit_price numeric(12,2);
  line_total numeric(12,2);
  item_vat numeric(12,2);
  item_rows jsonb := '[]'::jsonb;
  subtotal numeric(12,2) := 0;
  shipping numeric(12,2);
  free_over numeric(12,2);
  vat_rate numeric(5,2);
  vat_total numeric(12,2);
  total numeric(12,2);
  prices_include_vat boolean;
  shipping_taxable boolean;
  reference text := 'chk_' || p_idempotency_key::text;
  payload_hash text;
  customer_email text := lower(btrim(p_customer->>'email'));
  max_guest_products integer;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 100 then
    raise exception 'EMPTY_CART';
  end if;
  if customer_email is null or customer_email = '' then
    raise exception 'INVALID_CUSTOMER';
  end if;

  -- Serialize duplicate submissions, including ones arriving concurrently.
  perform pg_advisory_xact_lock(hashtext(reference));
  payload_hash := md5(p_lines::text || p_customer::text || coalesce(p_user_id::text, 'guest'));
  select * into previous_order from public.orders where payment_reference = reference;
  if found then
    if previous_order.checkout_hash is distinct from payload_hash then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'orderNumber', previous_order.order_number,
      'token', previous_order.confirmation_token,
      'total', previous_order.total,
      'isTest', previous_order.is_test
    );
  end if;

  if p_user_id is null then
    select value into guest_settings from public.site_settings
      where key = 'guest_cart_max_distinct_products';
    max_guest_products := coalesce((guest_settings->>'value')::integer, 3);
    if (select count(distinct x->>'productId') from jsonb_array_elements(p_lines) x) > max_guest_products then
      raise exception 'GUEST_LIMIT';
    end if;
    if exists (select 1 from public.guest_checkout_usage where email = customer_email) then
      raise exception 'GUEST_USED';
    end if;
  end if;

  select value into settings from public.site_content where key = 'settings' for share;
  if settings is null
     or settings->>'shipping_flat' is null
     or settings->>'vat_rate' is null
     or settings->>'prices_include_vat' is null
     or settings->>'shipping_taxable' is null then
    raise exception 'CHECKOUT_CONFIG_MISSING';
  end if;
  shipping := (settings->>'shipping_flat')::numeric(12,2);
  vat_rate := (settings->>'vat_rate')::numeric(5,2);
  prices_include_vat := (settings->>'prices_include_vat')::boolean;
  shipping_taxable := (settings->>'shipping_taxable')::boolean;
  if settings->>'free_shipping_over' is not null then
    free_over := (settings->>'free_shipping_over')::numeric(12,2);
  end if;
  if shipping < 0 or vat_rate < 0 or vat_rate > 100 or (free_over is not null and free_over < 0) then
    raise exception 'CHECKOUT_CONFIG_INVALID';
  end if;

  -- Sorting before locking prevents deadlocks when two carts contain the same
  -- products in different orders. Each lookup locks the exact stock row.
  for line in
    select value from jsonb_array_elements(p_lines) as t(value)
    order by value->>'productId', value->>'variantId'
  loop
    if jsonb_typeof(line->'qty') <> 'number'
       or (line->>'qty') !~ '^[1-9][0-9]{0,5}$'
       or (line->>'qty')::integer > 100000 then
      raise exception 'INVALID_QUANTITY';
    end if;
    line_qty := (line->>'qty')::integer;
    line_key := (line->>'productId') || ':' || coalesce(line->>'variantId', 'standard');
    if line_key = any(seen) then raise exception 'DUPLICATE_LINE'; end if;
    seen := array_append(seen, line_key);

    select * into product_row from public.products
      where id = (line->>'productId')::uuid for update;
    if not found or product_row.status <> 'published' or product_row.is_archived then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    if product_row.currency <> 'RON' or product_row.price < 0 then
      raise exception 'PRICE_INVALID';
    end if;
    if line_qty < greatest(1, product_row.min_order_qty)
       or (line_qty - greatest(1, product_row.min_order_qty)) %
          greatest(1, product_row.qty_increment) <> 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    variant_row := null;
    if line->>'variantId' is not null then
      select * into variant_row from public.product_variants
        where id = (line->>'variantId')::uuid
          and product_id = product_row.id for update;
      if not found then raise exception 'VARIANT_UNAVAILABLE'; end if;
    elsif exists (select 1 from public.product_variants where product_id = product_row.id) then
      raise exception 'VARIANT_REQUIRED';
    end if;

    if product_row.track_stock then
      if variant_row.id is not null then
        if variant_row.stock < line_qty then raise exception 'STOCK_CHANGED'; end if;
      elsif product_row.stock < line_qty then
        raise exception 'STOCK_CHANGED';
      end if;
    end if;
    unit_price := coalesce(variant_row.price, product_row.price);
    if unit_price < 0 then raise exception 'PRICE_INVALID'; end if;
    line_total := unit_price * line_qty;
    subtotal := subtotal + line_total;
    item_vat := case when prices_include_vat
      then round(line_total * vat_rate / (100 + vat_rate), 2)
      else round(line_total * vat_rate / 100, 2) end;

    item_rows := item_rows || jsonb_build_array(jsonb_build_object(
      'product_id', product_row.id,
      'variant_id', variant_row.id,
      'product_name', product_row.name,
      'variant_name', variant_row.name,
      'sku', coalesce(variant_row.sku, product_row.sku),
      'selling_unit', product_row.selling_unit,
      'units_per_pack', product_row.units_per_pack,
      'quantity', line_qty,
      'unit_price', unit_price,
      'line_total', line_total,
      'vat_rate', vat_rate,
      'vat_total', item_vat,
      'track_stock', product_row.track_stock
    ));
  end loop;

  if free_over is not null and subtotal >= free_over then shipping := 0; end if;
  vat_total := case when prices_include_vat
    then round((subtotal + case when shipping_taxable then shipping else 0 end)
      * vat_rate / (100 + vat_rate), 2)
    else round((subtotal + case when shipping_taxable then shipping else 0 end)
      * vat_rate / 100, 2) end;
  total := subtotal + shipping + case when prices_include_vat then 0 else vat_total end;
  if p_expected_total is not null and p_expected_total <> total then
    raise exception 'PRICE_CHANGED';
  end if;

  insert into public.orders (
    user_id, email, phone, contact_name, company_name, cui, reg_com,
    delivery_address, city, county, postal_code, delivery_instructions,
    billing_address, billing_city, billing_county, billing_postal_code,
    notes, is_guest, email_verified, payment_reference, checkout_hash,
    subtotal, shipping_total, tax_total, total, vat_rate, prices_include_vat,
    is_test, status, payment_status
  ) values (
    p_user_id, customer_email, p_customer->>'phone', p_customer->>'contact_name',
    p_customer->>'company_name', p_customer->>'cui', p_customer->>'reg_com',
    p_customer->>'delivery_address', p_customer->>'city', p_customer->>'county',
    p_customer->>'postal_code', p_customer->>'delivery_instructions',
    p_customer->>'billing_address', p_customer->>'billing_city',
    p_customer->>'billing_county', p_customer->>'billing_postal_code',
    p_customer->>'notes', p_user_id is null, p_user_id is not null,
    reference, payload_hash, subtotal, shipping, vat_total, total,
    vat_rate, prices_include_vat, true, 'nou', 'neplatit'
  ) returning * into placed_order;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, variant_name, sku,
    selling_unit, units_per_pack, quantity, unit_price, line_total,
    vat_rate, vat_total
  )
  select placed_order.id, (x->>'product_id')::uuid,
    nullif(x->>'variant_id','')::uuid, x->>'product_name',
    x->>'variant_name', x->>'sku', x->>'selling_unit',
    nullif(x->>'units_per_pack','')::integer,
    (x->>'quantity')::integer, (x->>'unit_price')::numeric,
    (x->>'line_total')::numeric, (x->>'vat_rate')::numeric,
    (x->>'vat_total')::numeric
  from jsonb_array_elements(item_rows) x;

  for line in select value from jsonb_array_elements(item_rows) t(value) loop
    if (line->>'track_stock')::boolean then
      if line->>'variant_id' is not null then
        update public.product_variants
          set stock = stock - (line->>'quantity')::integer
          where id = (line->>'variant_id')::uuid;
      else
        update public.products
          set stock = stock - (line->>'quantity')::integer
          where id = (line->>'product_id')::uuid;
      end if;
    end if;
  end loop;

  if p_user_id is null then
    insert into public.guest_checkout_usage(email, first_order_id)
      values (customer_email, placed_order.id);
  end if;

  return jsonb_build_object(
    'orderNumber', placed_order.order_number,
    'token', placed_order.confirmation_token,
    'total', placed_order.total,
    'isTest', true
  );
end;
$$;

revoke all on function public.checkout_place(jsonb,jsonb,uuid,uuid,numeric) from public, anon, authenticated;
grant execute on function public.checkout_place(jsonb,jsonb,uuid,uuid,numeric) to service_role;
