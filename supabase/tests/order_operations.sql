-- Run only against a disposable database after applying migrations. All fixtures roll back.
begin;
do $$
declare
  v_product uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
  v_order uuid;
  v_registered uuid;
  v_variant uuid := gen_random_uuid();
  v_variant_order uuid;
  v_items jsonb;
  v_order_data jsonb;
  v_stock integer;
  v_shipping numeric;
  v_price numeric;
begin
  insert into public.products(id,slug,name,price,stock,status)
  values (v_product,'order-operations-test-'||v_product::text,'Produs test',10,10,'published');
  v_items := jsonb_build_array(jsonb_build_object(
    'product_id',v_product,'product_name','Produs test','quantity',5,
    'unit_price',10,'line_total',50));
  v_order_data := jsonb_build_object(
    'contact_name','Client test','email','guest@example.test',
    'is_guest',true,'email_verified',false,'payment_reference','ops-test-'||v_product::text,
    'subtotal',50,'shipping_total',30,'tax_total',0,'total',80,'is_test',false);
  select id into v_order from public.create_order_tx(v_order_data,v_items);
  select stock into v_stock from public.products where id=v_product;
  if v_stock <> 5 then raise exception 'Quantity five was not deducted exactly once'; end if;
  select shipping_total into v_shipping from public.orders where id=v_order;
  if v_shipping <> 30 then raise exception 'Delivery snapshot differs from 30'; end if;
  if not exists (select 1 from public.orders where id=v_order and payment_method='cash'
    and payment_status='in_asteptare' and stock_applied and user_id is null) then
    raise exception 'Guest cash order state is incorrect';
  end if;
  begin
    perform id from public.create_order_tx(v_order_data,v_items);
    raise exception 'Duplicate checkout was accepted';
  exception when unique_violation then null;
  end;
  select stock into v_stock from public.products where id=v_product;
  if v_stock <> 5 then raise exception 'Duplicate checkout deducted inventory'; end if;
  begin
    perform id from public.create_order_tx(
      jsonb_set(v_order_data,'{payment_reference}',to_jsonb('insufficient-'||v_product::text)),
      jsonb_build_array(jsonb_build_object('product_id',v_product,'product_name','Produs test',
        'quantity',6,'unit_price',10,'line_total',60)));
    raise exception 'Oversell was accepted';
  exception when others then
    if sqlerrm not like 'STOC_INSUFICIENT:%' then raise; end if;
  end;
  if exists (select 1 from public.orders where payment_reference='insufficient-'||v_product::text) then
    raise exception 'Failed checkout persisted an order';
  end if;
  update public.products set price=99 where id=v_product;
  select unit_price into v_price from public.order_items where order_id=v_order;
  if v_price <> 10 then raise exception 'Historical price changed'; end if;
  update public.orders set status='anulat' where id=v_order;
  update public.orders set status='anulat' where id=v_order;
  select stock into v_stock from public.products where id=v_product;
  if v_stock <> 10 then raise exception 'Cancellation did not restore stock exactly once'; end if;
  begin
    update public.orders set status='confirmat' where id=v_order;
    raise exception 'Cancelled order was reactivated';
  exception when others then
    if sqlerrm <> 'COMANDA_ANULATA_NU_SE_REACTIVEAZA' then raise; end if;
  end;
  v_order_data := v_order_data || jsonb_build_object(
    'user_id',v_user,'is_guest',false,'payment_reference','registered-'||v_product::text,
    'shipping_total',35,'total',85);
  select id into v_registered from public.create_order_tx(v_order_data,v_items);
  if not exists (select 1 from public.orders where id=v_registered and user_id=v_user
    and payment_method='cash' and payment_status='in_asteptare' and shipping_total=35) then
    raise exception 'Registered cash order or new delivery snapshot is incorrect';
  end if;
  begin
    delete from public.products where id=v_product;
    raise exception 'Product backing an open order was deleted';
  exception when others then
    if sqlerrm <> 'PRODUS_ARE_COMENZI_ACTIVE' then raise; end if;
  end;
  update public.orders set payment_status='platit' where id=v_registered;
  if not exists (select 1 from public.orders where id=v_registered and payment_status='platit') then
    raise exception 'Cash order could not be marked paid';
  end if;
  select shipping_total into v_shipping from public.orders where id=v_order;
  if v_shipping <> 30 then raise exception 'Older delivery snapshot changed'; end if;

  insert into public.product_variants(id,product_id,name,stock)
  values(v_variant,v_product,'Mărimea M',5);
  if not exists (select 1 from public.products where id=v_product and variant_stock_tracked) then
    raise exception 'Variant inventory mode was not persisted';
  end if;
  v_items := jsonb_build_array(jsonb_build_object('product_id',v_product,'variant_id',v_variant,
    'product_name','Produs test','quantity',5,'unit_price',10,'line_total',50));
  v_order_data := v_order_data || jsonb_build_object('payment_reference','variant-'||v_product::text);
  select id into v_variant_order from public.create_order_tx(v_order_data,v_items);
  if not exists (select 1 from public.product_variants where id=v_variant and stock=0) then
    raise exception 'Variant quantity was not deducted';
  end if;
  begin
    delete from public.product_variants where id=v_variant;
    raise exception 'Variant backing an open order was deleted';
  exception when others then
    if sqlerrm <> 'VARIANTA_ARE_COMENZI_ACTIVE' then raise; end if;
  end;
  begin
    perform id from public.create_order_tx(
      v_order_data || jsonb_build_object('payment_reference','variant-oversell-'||v_product::text),
      jsonb_build_array(jsonb_build_object('product_id',v_product,'variant_id',v_variant,
        'product_name','Produs test','quantity',1,'unit_price',10,'line_total',10)));
    raise exception 'Sold-out variant incorrectly used product-level stock';
  exception when others then
    if sqlerrm not like 'STOC_INSUFICIENT:%' then raise; end if;
  end;
  update public.orders set status='anulat' where id=v_variant_order;
  if not exists (select 1 from public.product_variants where id=v_variant and stock=5) then
    raise exception 'Variant stock was not restored';
  end if;
  delete from public.product_variants where id=v_variant;
  if not has_column_privilege('authenticated','public.orders','status','UPDATE')
     or has_column_privilege('authenticated','public.orders','total','UPDATE') then
    raise exception 'Operational column grants are too broad or missing';
  end if;
end;
$$;
rollback;
