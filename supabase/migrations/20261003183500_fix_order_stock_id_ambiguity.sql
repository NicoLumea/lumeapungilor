CREATE OR REPLACE FUNCTION public.create_order_tx(p_order jsonb, p_items jsonb) RETURNS TABLE(id uuid, order_number text, total numeric, is_test boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
        update public.product_variants as pv set stock = pv.stock - v_line.quantity where pv.id = v_line.variant_id;
        v_source := 'variant';
      else
        if v_product.stock < v_line.quantity then
          raise exception 'STOC_INSUFICIENT:%', v_product.name;
        end if;
        update public.products as p set stock = p.stock - v_line.quantity where p.id = v_line.product_id;
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