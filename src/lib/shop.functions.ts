import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  qty: z.number().int().positive().max(100000),
});

const orderSchema = z.object({
  idempotencyKey: z.string().min(8).max(80),
  expectedTotal: z.number().nonnegative().optional(),
  customer: z.object({
    contact_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional().nullable(),
    company_name: z.string().trim().max(160).optional().nullable(),
    cui: z.string().trim().max(40).optional().nullable(),
    reg_com: z.string().trim().max(60).optional().nullable(),
    billing_address: z.string().trim().max(400).optional().nullable(),
    delivery_address: z.string().trim().max(400).optional().nullable(),
    city: z.string().trim().max(120).optional().nullable(),
    county: z.string().trim().max(120).optional().nullable(),
    postal_code: z.string().trim().max(20).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
  lines: z.array(lineSchema).min(1).max(100),
});

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number; isTest: boolean }
  | { ok: false; error: string };

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotency: a repeated submit returns the existing order.
    const reference = `chk_${data.idempotencyKey}`;
    const existing = await supabaseAdmin
      .from("orders")
      .select("order_number,total,is_test")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing.data) {
      return {
        ok: true,
        orderNumber: existing.data.order_number,
        total: Number(existing.data.total),
        isTest: existing.data.is_test,
      };
    }

    const ids = [...new Set(data.lines.map((l) => l.productId))];
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("*, product_variants(*)")
      .in("id", ids);
    if (pErr) return { ok: false, error: "Nu am putut verifica produsele." };

    type OrderItemInsert = {
      product_id: string;
      variant_id: string | null;
      product_name: string;
      variant_name: string | null;
      sku: string | null;
      selling_unit: string | null;
      units_per_pack: number | null;
      quantity: number;
      unit_price: number;
      line_total: number;
    };
    const items: OrderItemInsert[] = [];
    let subtotal = 0;

    for (const line of data.lines) {
      const product = (products ?? []).find((p) => p.id === line.productId);
      if (!product || product.status !== "published" || product.is_archived) {
        return { ok: false, error: "Un produs din coș nu mai este disponibil." };
      }
      const min = Math.max(1, product.min_order_qty || 1);
      const step = Math.max(1, product.qty_increment || 1);
      if (line.qty < min || (line.qty - min) % step !== 0) {
        return {
          ok: false,
          error: `Cantitatea pentru „${product.name}” trebuie să pornească de la ${min} și să crească din ${step} în ${step}.`,
        };
      }

      const variants = (product.product_variants ?? []) as Array<{
        id: string;
        name: string;
        sku: string | null;
        price: number | null;
        stock: number;
      }>;
      const variant = line.variantId ? variants.find((v) => v.id === line.variantId) : null;
      if (line.variantId && !variant) {
        return { ok: false, error: "O opțiune selectată nu mai există." };
      }

      const stock = variant ? variant.stock : product.stock;
      if (product.track_stock && line.qty > stock) {
        return { ok: false, error: `Stoc insuficient pentru „${product.name}”.` };
      }

      const unitPrice = Number(variant?.price ?? product.price);
      const lineTotal = Math.round(unitPrice * line.qty * 100) / 100;
      subtotal += lineTotal;

      items.push({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: product.name,
        variant_name: variant?.name ?? null,
        sku: variant?.sku ?? product.sku,
        selling_unit: product.selling_unit,
        units_per_pack: product.units_per_pack,
        quantity: line.qty,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    const { data: settingsRow } = await supabaseAdmin
      .from("site_content")
      .select("value")
      .eq("key", "settings")
      .maybeSingle();
    const settings = (settingsRow?.value ?? {}) as Record<string, unknown>;
    const toNum = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

    const flat = toNum(settings["shipping_flat"]);
    const freeOver = toNum(settings["free_shipping_over"]);
    const vatRate = toNum(settings["vat_rate"]);
    const paymentsConfigured = settings["payments_configured"] === true;

    const shipping = flat === null ? 0 : freeOver !== null && subtotal >= freeOver ? 0 : flat;
    const tax = vatRate === null ? 0 : Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    if (data.expectedTotal !== undefined && Math.abs(data.expectedTotal - total) > 0.01) {
      return {
        ok: false,
        error: "Prețurile s-au actualizat între timp. Te rugăm să reîncarci coșul.",
      };
    }

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        contact_name: data.customer.contact_name,
        email: data.customer.email,
        phone: data.customer.phone ?? null,
        company_name: data.customer.company_name ?? null,
        cui: data.customer.cui ?? null,
        reg_com: data.customer.reg_com ?? null,
        billing_address: data.customer.billing_address ?? null,
        delivery_address: data.customer.delivery_address ?? null,
        city: data.customer.city ?? null,
        county: data.customer.county ?? null,
        postal_code: data.customer.postal_code ?? null,
        notes: data.customer.notes ?? null,
        payment_reference: reference,
        subtotal,
        shipping_total: shipping,
        tax_total: tax,
        total,
        is_test: !paymentsConfigured,
        status: "nou",
        payment_status: paymentsConfigured ? "in_asteptare" : "neplatit",
      })
      .select("id, order_number, total, is_test")
      .single();

    if (oErr || !order) {
      // Unique violation means a parallel submit already created it.
      const retry = await supabaseAdmin
        .from("orders")
        .select("order_number,total,is_test")
        .eq("payment_reference", reference)
        .maybeSingle();
      if (retry.data) {
        return {
          ok: true,
          orderNumber: retry.data.order_number,
          total: Number(retry.data.total),
          isTest: retry.data.is_test,
        };
      }
      return { ok: false, error: "Comanda nu a putut fi salvată." };
    }

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (iErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return { ok: false, error: "Comanda nu a putut fi salvată." };
    }

    return {
      ok: true,
      orderNumber: order.order_number,
      total: Number(order.total),
      isTest: order.is_test,
    };
  });

/** One-time owner setup: exchanges the private setup code for admin rights. */
export const claimOwnerAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().min(4).max(200), userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const expected = process.env["OWNER_SETUP_CODE"];
    if (!expected) return { ok: false, error: "Codul de configurare nu este setat." };
    if (data.code !== expected) return { ok: false, error: "Cod de configurare incorect." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (uErr || !user?.user) return { ok: false, error: "Cont inexistent." };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) return { ok: false, error: "Nu am putut acorda accesul." };
    return { ok: true };
  });
