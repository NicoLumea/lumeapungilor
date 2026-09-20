-- 1. Category rename + slug change
UPDATE public.categories SET slug = 'pungi-fara-maner', name = 'Pungi fără mâner', updated_at = now() WHERE slug = 'pungi-hartie';
UPDATE public.categories SET name = 'Pungi cu mâner', updated_at = now() WHERE slug = 'pungi-plastic';

-- 2. Reassign products that clearly have handles out of the "no handle" category
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pungi-plastic'), updated_at = now()
WHERE id IN ('61a56730-ac00-48a4-8280-c1aae80300d3','0dd34762-7064-4f10-b257-c6c00339043b');

-- 3. Restock notification requests
CREATE TABLE IF NOT EXISTS public.restock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  email text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'activ',
  notified_at timestamptz,
  notify_error text,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS restock_requests_active_unique
  ON public.restock_requests (product_id, lower(email))
  WHERE status = 'activ';
CREATE UNIQUE INDEX IF NOT EXISTS restock_requests_token_unique
  ON public.restock_requests (unsubscribe_token);

GRANT SELECT, UPDATE ON public.restock_requests TO authenticated;
GRANT ALL ON public.restock_requests TO service_role;

ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read restock requests" ON public.restock_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'employee') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Staff can update restock requests" ON public.restock_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'employee') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'employee') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER restock_requests_updated_at
  BEFORE UPDATE ON public.restock_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Order notification bookkeeping
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'netrimis',
  ADD COLUMN IF NOT EXISTS notification_error text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS stock_applied boolean NOT NULL DEFAULT false;

-- 5. Atomic order creation (service role only)
CREATE OR REPLACE FUNCTION public.create_order_tx(p_order jsonb, p_items jsonb)
RETURNS TABLE (id uuid, order_number text, total numeric, is_test boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_available integer;
  v_track boolean;
  v_name text;
BEGIN
  -- Re-check stock under row locks so concurrent checkouts cannot oversell.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.track_stock, p.name,
           CASE WHEN (v_item->>'variant_id') IS NOT NULL
                     AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock > 0)
                THEN (SELECT pv.stock FROM product_variants pv WHERE pv.id = (v_item->>'variant_id')::uuid)
                ELSE p.stock END
      INTO v_track, v_name, v_available
      FROM products p
     WHERE p.id = (v_item->>'product_id')::uuid
     FOR UPDATE;

    IF v_name IS NULL THEN
      RAISE EXCEPTION 'PRODUS_INDISPONIBIL';
    END IF;

    IF v_track AND coalesce(v_available, 0) < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'STOC_INSUFICIENT:%', v_name;
    END IF;
  END LOOP;

  INSERT INTO orders (
    contact_name, email, phone, company_name, cui, reg_com, billing_address, delivery_address,
    city, county, postal_code, notes, user_id, is_guest, email_verified, payment_reference,
    subtotal, shipping_total, tax_total, total, is_test, status, payment_status
  )
  SELECT
    p_order->>'contact_name', p_order->>'email', p_order->>'phone', p_order->>'company_name',
    p_order->>'cui', p_order->>'reg_com', p_order->>'billing_address', p_order->>'delivery_address',
    p_order->>'city', p_order->>'county', p_order->>'postal_code', p_order->>'notes',
    nullif(p_order->>'user_id','')::uuid, (p_order->>'is_guest')::boolean, (p_order->>'email_verified')::boolean,
    p_order->>'payment_reference', (p_order->>'subtotal')::numeric, (p_order->>'shipping_total')::numeric,
    (p_order->>'tax_total')::numeric, (p_order->>'total')::numeric, (p_order->>'is_test')::boolean,
    p_order->>'status', p_order->>'payment_status'
  RETURNING orders.id INTO v_order_id;

  INSERT INTO order_items (
    order_id, product_id, variant_id, product_name, variant_name, sku, selling_unit,
    units_per_pack, quantity, unit_price, line_total
  )
  SELECT v_order_id,
         (i->>'product_id')::uuid,
         nullif(i->>'variant_id','')::uuid,
         i->>'product_name',
         i->>'variant_name',
         i->>'sku',
         i->>'selling_unit',
         nullif(i->>'units_per_pack','')::int,
         (i->>'quantity')::int,
         (i->>'unit_price')::numeric,
         (i->>'line_total')::numeric
    FROM jsonb_array_elements(p_items) AS i;

  RETURN QUERY
  SELECT o.id, o.order_number, o.total, o.is_test FROM orders o WHERE o.id = v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_tx(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_tx(jsonb, jsonb) TO service_role;

-- 6. Inventory rule: stock is reserved when an order is confirmed, released when cancelled
CREATE OR REPLACE FUNCTION public.apply_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it record;
BEGIN
  IF NEW.status = 'confirmat' AND NOT OLD.stock_applied THEN
    FOR it IN SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
      IF it.variant_id IS NOT NULL AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = it.product_id AND v.stock > 0) THEN
        UPDATE product_variants SET stock = greatest(0, stock - it.quantity) WHERE id = it.variant_id;
      ELSE
        UPDATE products SET stock = greatest(0, stock - it.quantity) WHERE id = it.product_id AND track_stock;
      END IF;
    END LOOP;
    NEW.stock_applied := true;
  ELSIF NEW.status = 'anulat' AND OLD.stock_applied THEN
    FOR it IN SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
      IF it.variant_id IS NOT NULL AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = it.product_id AND v.stock > 0) THEN
        UPDATE product_variants SET stock = stock + it.quantity WHERE id = it.variant_id;
      ELSE
        UPDATE products SET stock = stock + it.quantity WHERE id = it.product_id AND track_stock;
      END IF;
    END LOOP;
    NEW.stock_applied := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_apply_stock ON public.orders;
CREATE TRIGGER orders_apply_stock
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.apply_order_stock();

-- 7. Best-selling products from genuinely confirmed/finished orders
CREATE OR REPLACE FUNCTION public.top_selling_products(p_limit integer DEFAULT 5)
RETURNS TABLE (product_id uuid, sold integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.product_id, sum(oi.quantity)::int AS sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
   WHERE o.status IN ('confirmat','in_livrare','finalizat')
     AND o.is_test = false
   GROUP BY oi.product_id
   ORDER BY sold DESC
   LIMIT greatest(1, coalesce(p_limit, 5));
$$;

GRANT EXECUTE ON FUNCTION public.top_selling_products(integer) TO anon, authenticated, service_role;

-- 8. Admin-editable configuration points (empty until the business confirms them)
INSERT INTO public.site_settings (key, value, is_public) VALUES
  ('payment_methods', '{"methods": [], "note": "DE CONFIGURAT: adaugă aici doar metodele de plată confirmate de firmă."}'::jsonb, true),
  ('delivery_methods', '{"methods": [], "note": "DE CONFIGURAT: adaugă aici doar metodele de livrare confirmate de firmă."}'::jsonb, true),
  ('inventory_rule', '{"reserve_at_status": "confirmat"}'::jsonb, true),
  ('consumer_info', '{"anpc_url": "https://anpc.ro/", "sal_url": "https://reclamatiisal.anpc.ro/", "note": "DE REVIZUIT JURIDIC"}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;