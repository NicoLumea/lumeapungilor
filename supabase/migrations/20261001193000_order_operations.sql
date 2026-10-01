-- Reuse the published settings object rather than introducing a second delivery tariff.
update public.site_content
set value = jsonb_set(value, '{shipping_flat}', '30'::jsonb, true)
where key = 'settings' and (value->>'shipping_flat') is null;

create or replace function public.set_delivery_fee(p_fee numeric)
returns numeric language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_fee is null or p_fee < 0 or p_fee > 10000 or round(p_fee,2) <> p_fee then
    raise exception 'COST_LIVRARE_INVALID';
  end if;
  update public.site_content set value=jsonb_set(value,'{shipping_flat}',to_jsonb(p_fee),true)
  where key='settings';
  if not found then raise exception 'SETARE_LIVRARE_LIPSA'; end if;
  return p_fee;
end;
$$;
revoke all on function public.set_delivery_fee(numeric) from public,anon;
grant execute on function public.set_delivery_fee(numeric) to authenticated;

alter table public.orders
  add column if not exists payment_method text not null default 'de_confirmat',
  add column if not exists stock_released boolean not null default false,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.order_items
  add column if not exists inventory_source text;
alter table public.products
  add column if not exists variant_stock_tracked boolean not null default false;
update public.products p set variant_stock_tracked=true
where exists (select 1 from public.product_variants pv where pv.product_id=p.id and pv.stock > 0);

create or replace function public.prevent_variant_stock_mode_reset()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.variant_stock_tracked and not new.variant_stock_tracked then
    raise exception 'VARIANT_STOCK_MODE_CANNOT_RESET';
  end if;
  return new;
end;
$$;
create trigger products_preserve_variant_stock_mode before update of variant_stock_tracked on public.products
for each row execute function public.prevent_variant_stock_mode_reset();

create or replace function public.mark_variant_stock_tracked()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock > 0 then
    update public.products set variant_stock_tracked=true
    where id=new.product_id and not variant_stock_tracked;
  end if;
  return new;
end;
$$;
create trigger variants_mark_stock_tracked after insert or update of stock on public.product_variants
for each row execute function public.mark_variant_stock_tracked();

-- NOT VALID preserves any legacy rows while enforcing nonnegative stock on new writes.
alter table public.products add constraint products_stock_nonnegative check (stock >= 0) not valid;
alter table public.product_variants add constraint variants_stock_nonnegative check (stock >= 0) not valid;

create index if not exists orders_created_page_idx on public.orders (created_at desc, id desc);
create index if not exists orders_user_history_idx on public.orders (user_id, created_at desc) where user_id is not null;
create index if not exists order_items_product_search_idx on public.order_items (order_id, product_name);

-- RLS chooses rows; column grants stop staff/admin from rewriting financial snapshots.
revoke update on public.orders from authenticated;
grant update (status, payment_status, internal_notes) on public.orders to authenticated;

create or replace function public.prevent_active_variant_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.order_items oi join public.orders o on o.id=oi.order_id
    where oi.variant_id=old.id and oi.inventory_source='variant'
      and o.stock_applied and not o.stock_released
  ) then raise exception 'VARIANTA_ARE_COMENZI_ACTIVE'; end if;
  return old;
end;
$$;
create trigger variants_preserve_active_orders before delete on public.product_variants
for each row execute function public.prevent_active_variant_delete();

create or replace function public.prevent_active_product_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.order_items oi join public.orders o on o.id=oi.order_id
    where oi.product_id=old.id and o.stock_applied and not o.stock_released
  ) then raise exception 'PRODUS_ARE_COMENZI_ACTIVE'; end if;
  return old;
end;
$$;
create trigger products_preserve_active_orders before delete on public.products
for each row execute function public.prevent_active_product_delete();

create or replace function public.create_order_tx(p_order jsonb, p_items jsonb)
returns table (id uuid, order_number text, total numeric, is_test boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_line record;
  v_product record;
  v_variant_stock integer;
  v_source text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'COMANDA_FARA_PRODUSE';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) i where (i->>'quantity')::integer <= 0) then
    raise exception 'CANTITATE_INVALIDA';
  end if;

  -- The unique payment_reference makes concurrent retries one order, not two.
  insert into public.orders (
    contact_name,email,phone,company_name,cui,reg_com,billing_address,delivery_address,
    city,county,postal_code,notes,user_id,is_guest,email_verified,payment_reference,
    subtotal,shipping_total,tax_total,total,is_test,status,payment_status,payment_method,stock_applied
  ) values (
    p_order->>'contact_name',p_order->>'email',p_order->>'phone',p_order->>'company_name',
    p_order->>'cui',p_order->>'reg_com',p_order->>'billing_address',p_order->>'delivery_address',
    p_order->>'city',p_order->>'county',p_order->>'postal_code',p_order->>'notes',
    nullif(p_order->>'user_id','')::uuid,(p_order->>'is_guest')::boolean,
    (p_order->>'email_verified')::boolean,p_order->>'payment_reference',
    (p_order->>'subtotal')::numeric,(p_order->>'shipping_total')::numeric,
    (p_order->>'tax_total')::numeric,(p_order->>'total')::numeric,
    (p_order->>'is_test')::boolean,'nou','in_asteptare','cash',true
  ) returning orders.id into v_order_id;

  -- Product locks, acquired in stable ID order, serialize competing checkouts.
  -- Aggregate repeated cart lines before testing inventory.
  for v_line in
    select (i->>'product_id')::uuid as product_id,
           nullif(i->>'variant_id','')::uuid as variant_id,
           sum((i->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) i
    group by 1,2 order by 1,2 nulls first
  loop
    select p.id,p.name,p.stock,p.track_stock,p.status,p.is_archived,p.variant_stock_tracked into v_product
    from public.products p where p.id = v_line.product_id for update;
    if not found or v_product.status <> 'published' or v_product.is_archived then
      raise exception 'PRODUS_INDISPONIBIL';
    end if;
    v_source := 'untracked';
    if v_product.track_stock then
      if v_line.variant_id is not null and v_product.variant_stock_tracked then
        select pv.stock into v_variant_stock from public.product_variants pv
        where pv.id = v_line.variant_id and pv.product_id = v_line.product_id for update;
        if not found then raise exception 'PRODUS_INDISPONIBIL'; end if;
        if v_variant_stock < v_line.quantity then
          raise exception 'STOC_INSUFICIENT:%', v_product.name;
        end if;
        update public.product_variants set stock = stock - v_line.quantity where id = v_line.variant_id;
        v_source := 'variant';
      else
        if v_product.stock < v_line.quantity then
          raise exception 'STOC_INSUFICIENT:%', v_product.name;
        end if;
        update public.products set stock = stock - v_line.quantity where id = v_line.product_id;
        v_source := 'product';
      end if;
    end if;
    insert into public.order_items (
      order_id,product_id,variant_id,product_name,variant_name,sku,selling_unit,
      units_per_pack,quantity,unit_price,line_total,inventory_source
    )
    select v_order_id,(i->>'product_id')::uuid,nullif(i->>'variant_id','')::uuid,
      i->>'product_name',i->>'variant_name',i->>'sku',i->>'selling_unit',
      nullif(i->>'units_per_pack','')::integer,(i->>'quantity')::integer,
      (i->>'unit_price')::numeric,(i->>'line_total')::numeric,v_source
    from jsonb_array_elements(p_items) i
    where (i->>'product_id')::uuid = v_line.product_id
      and nullif(i->>'variant_id','')::uuid is not distinct from v_line.variant_id;
  end loop;

  return query select o.id,o.order_number,o.total,o.is_test from public.orders o where o.id = v_order_id;
end;
$$;
revoke all on function public.create_order_tx(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.create_order_tx(jsonb,jsonb) to service_role;

create or replace function public.apply_order_stock()
returns trigger language plpgsql security definer set search_path = public
as $$
declare it record;
begin
  if new.status is distinct from old.status and new.status not in ('nou','confirmat','in_livrare','finalizat','anulat') then
    raise exception 'STATUS_COMANDA_INVALID';
  end if;
  if new.payment_status is distinct from old.payment_status and new.payment_status not in ('neplatit','in_asteptare','platit','rambursat','anulat') then
    raise exception 'STATUS_PLATA_INVALID';
  end if;
  if old.status = 'anulat' and new.status <> 'anulat' then
    raise exception 'COMANDA_ANULATA_NU_SE_REACTIVEAZA';
  end if;
  if new.status = 'anulat' and old.status is distinct from 'anulat' and old.stock_applied and not old.stock_released then
    for it in select product_id,variant_id,quantity,inventory_source from public.order_items where order_id = new.id loop
      if it.inventory_source = 'variant' then
        update public.product_variants set stock = stock + it.quantity where id = it.variant_id;
      elsif it.inventory_source = 'product' then
        update public.products set stock = stock + it.quantity where id = it.product_id;
      elsif it.inventory_source is null then
        -- Legacy orders predate inventory_source; use their old rule once only.
        if it.variant_id is not null and exists (
          select 1 from public.product_variants where id = it.variant_id and stock > 0
        ) then
          update public.product_variants set stock = stock + it.quantity where id = it.variant_id;
        else
          update public.products set stock = stock + it.quantity where id = it.product_id and track_stock;
        end if;
      end if;
    end loop;
    new.stock_applied := false;
    new.stock_released := true;
  elsif new.status in ('confirmat','in_livrare','finalizat') and not old.stock_applied and not old.stock_released then
    -- Old orders created before this migration still reserve on confirmation.
    for it in select product_id,variant_id,quantity from public.order_items where order_id = new.id loop
      if not exists (select 1 from public.products where id=it.product_id and track_stock) then
        continue;
      end if;
      if it.variant_id is not null and exists (
        select 1 from public.product_variants where id = it.variant_id and stock > 0
      ) then
        update public.product_variants set stock = stock - it.quantity
        where id = it.variant_id and stock >= it.quantity;
      else
        update public.products set stock = stock - it.quantity
        where id = it.product_id and track_stock and stock >= it.quantity;
      end if;
      if not found then raise exception 'STOC_INSUFICIENT'; end if;
    end loop;
    new.stock_applied := true;
  end if;
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists orders_apply_stock on public.orders;
create trigger orders_apply_stock before update of status,payment_status,internal_notes on public.orders
for each row execute function public.apply_order_stock();

create or replace function public.audit_order_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    insert into public.audit_logs(actor_id,action,entity,entity_id,details)
    values(auth.uid(),'order.status_changed','orders',new.id::text,
      jsonb_build_object('from_status',old.status,'to_status',new.status,
        'from_payment',old.payment_status,'to_payment',new.payment_status));
  end if;
  if new.internal_notes is distinct from old.internal_notes then
    insert into public.audit_logs(actor_id,action,entity,entity_id,details)
    values(auth.uid(),'order.note_changed','orders',new.id::text,'{}'::jsonb);
  end if;
  return new;
end;
$$;

-- Server-side catalog functions reject all non-staff callers before reading private rows.
create or replace function public.staff_order_catalog(
  p_search text default null,p_status text default null,p_payment_status text default null,
  p_payment_method text default null,p_customer_type text default null,
  p_from date default null,p_to date default null,p_limit integer default 25,p_offset integer default 0
)
returns setof public.orders language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  return query
  select o.* from public.orders o
  where (nullif(trim(p_search),'') is null or
    o.order_number ilike '%'||p_search||'%' or o.contact_name ilike '%'||p_search||'%' or
    o.email ilike '%'||p_search||'%' or coalesce(o.company_name,'') ilike '%'||p_search||'%' or
    o.user_id::text ilike '%'||p_search||'%' or exists (
      select 1 from public.order_items oi where oi.order_id=o.id and oi.product_name ilike '%'||p_search||'%'
    ))
    and (p_status is null or o.status=p_status)
    and (p_payment_status is null or o.payment_status=p_payment_status)
    and (p_payment_method is null or o.payment_method=p_payment_method)
    and (p_customer_type is null or (case when o.user_id is null then 'guest' else 'registered' end)=p_customer_type)
    and (p_from is null or o.created_at >= p_from::timestamptz)
    and (p_to is null or o.created_at < (p_to+1)::timestamptz)
  order by o.created_at desc,o.id desc
  limit least(greatest(p_limit,1),50) offset greatest(p_offset,0);
end;
$$;
revoke all on function public.staff_order_catalog(text,text,text,text,text,date,date,integer,integer) from public,anon;
grant execute on function public.staff_order_catalog(text,text,text,text,text,date,date,integer,integer) to authenticated;

create or replace function public.staff_customer_catalog(p_search text default null,p_limit integer default 25,p_offset integer default 0)
returns table (id uuid,email text,full_name text,company_name text,phone text,created_at timestamptz,
  completed_orders bigint,last_order_at timestamptz,total_spent numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  return query
  select p.id,p.email,coalesce(p.full_name,max(o.contact_name)),
    coalesce(p.company_name,max(o.company_name)),coalesce(p.phone,max(o.phone)),p.created_at,
    count(o.id) filter (where o.status='finalizat' and not o.is_test),
    max(o.created_at) filter (where not o.is_test),
    coalesce(sum(o.total) filter (where o.status='finalizat' and not o.is_test),0)
  from public.profiles p
  left join public.orders o on o.user_id=p.id
  where not exists (select 1 from public.user_roles r where r.user_id=p.id and r.role in ('employee','admin','owner'))
    and (nullif(trim(p_search),'') is null or p.email ilike '%'||p_search||'%'
    or coalesce(p.full_name,'') ilike '%'||p_search||'%'
    or coalesce(p.company_name,'') ilike '%'||p_search||'%' or p.id::text ilike '%'||p_search||'%')
  group by p.id,p.email,p.full_name,p.company_name,p.phone,p.created_at
  order by p.created_at desc,p.id desc
  limit least(greatest(p_limit,1),50) offset greatest(p_offset,0);
end;
$$;
revoke all on function public.staff_customer_catalog(text,integer,integer) from public,anon;
grant execute on function public.staff_customer_catalog(text,integer,integer) to authenticated;
