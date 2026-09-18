import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkoutCustomerSchema, normalizedCustomer } from "./checkout-schema";

const lineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  qty: z.number().int().positive().max(100000),
});
const orderSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    expectedTotal: z.number().finite().nonnegative().optional(),
    customer: checkoutCustomerSchema,
    lines: z.array(lineSchema).min(1).max(100),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    for (const [index, line] of value.lines.entries()) {
      const key = `${line.productId}:${line.variantId ?? "standard"}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["lines", index],
          message: "Produsul apare de două ori în coș.",
        });
      }
      seen.add(key);
    }
  });

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; token: string; total: number; isTest: true }
  | { ok: false; error: string; refreshCart?: boolean };

const ORDER_ERRORS: Record<string, { error: string; refreshCart?: boolean }> = {
  EMPTY_CART: { error: "Coșul este gol." },
  INVALID_CUSTOMER: { error: "Verifică datele de contact și adresa." },
  GUEST_LIMIT: { error: "Ai prea multe produse diferite pentru o comandă fără cont." },
  GUEST_USED: {
    error:
      "Această adresă de e-mail a fost deja folosită pentru o comandă fără cont. Autentifică-te pentru a comanda din nou.",
  },
  CHECKOUT_CONFIG_MISSING: {
    error:
      "Finalizarea comenzii este temporar indisponibilă. Configurația de livrare și TVA trebuie completată.",
  },
  CHECKOUT_CONFIG_INVALID: {
    error:
      "Finalizarea comenzii este temporar indisponibilă. Configurația de livrare și TVA trebuie verificată.",
  },
  PRODUCT_UNAVAILABLE: { error: "Un produs din coș nu mai este disponibil.", refreshCart: true },
  VARIANT_UNAVAILABLE: { error: "O variantă din coș nu mai este disponibilă.", refreshCart: true },
  VARIANT_REQUIRED: { error: "Selectează o variantă pentru fiecare produs.", refreshCart: true },
  STOCK_CHANGED: { error: "Stocul s-a modificat. Verifică din nou coșul.", refreshCart: true },
  PRICE_CHANGED: {
    error:
      "Prețul sau costul livrării s-a modificat. Verifică noul total înainte de a trimite comanda.",
    refreshCart: true,
  },
  INVALID_QUANTITY: { error: "Verifică numărul de seturi din coș.", refreshCart: true },
  IDEMPOTENCY_CONFLICT: {
    error:
      "Această încercare de comandă a fost deja folosită. Reîncarcă pagina și încearcă din nou.",
  },
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { checkRateLimit } = await import("./rate-limit.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    const email = data.customer.email.trim().toLowerCase();
    const throttle = await checkRateLimit("checkout", email, 20, 900);
    if (!throttle.allowed) {
      return {
        ok: false,
        error: "Prea multe încercări de comandă. Te rugăm să reîncerci mai târziu.",
      };
    }

    let userId: string | null = null;
    const authHeader = getRequestHeader("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.slice(7),
      );
      if (authError || !authUser.user) {
        return { ok: false, error: "Sesiunea a expirat. Autentifică-te din nou." };
      }
      userId = authUser.user.id;
    }

    const { data: result, error } = await supabaseAdmin.rpc(
      "checkout_place" as never,
      {
        p_lines: data.lines,
        p_customer: normalizedCustomer(data.customer),
        p_user_id: userId,
        p_idempotency_key: data.idempotencyKey,
        p_expected_total: data.expectedTotal ?? null,
      } as never,
    );
    if (error) {
      const code = Object.keys(ORDER_ERRORS).find((key) => error.message.includes(key));
      const mapped = code ? ORDER_ERRORS[code] : undefined;
      if (mapped)
        return {
          ok: false,
          error: mapped.error,
          ...(mapped.refreshCart ? { refreshCart: true } : {}),
        };
      return { ok: false, error: "Comanda nu a putut fi înregistrată. Încearcă din nou." };
    }
    const order = result as unknown as { orderNumber?: string; token?: string; total?: number };
    if (!order?.orderNumber || !order.token || typeof order.total !== "number") {
      return {
        ok: false,
        error:
          "Confirmarea comenzii nu este disponibilă. Contactează magazinul înainte de a retrimite.",
      };
    }
    return {
      ok: true,
      orderNumber: order.orderNumber,
      token: order.token,
      total: order.total,
      isTest: true,
    };
  });

export const getOrderConfirmation = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        orderNumber: z.string().regex(/^LP-\d+$/),
        token: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id,order_number,subtotal,shipping_total,tax_total,total,vat_rate,prices_include_vat,is_test",
      )
      .eq("order_number", data.orderNumber)
      .eq("confirmation_token", data.token)
      .maybeSingle();
    if (error || !order) return null;
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select(
        "product_name,variant_name,selling_unit,units_per_pack,quantity,unit_price,line_total",
      )
      .eq("order_id", order.id);
    if (itemsError) return null;
    return {
      orderNumber: order.order_number,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping_total),
      vat: Number(order.tax_total),
      vatRate: Number(order.vat_rate),
      pricesIncludeVat: order.prices_include_vat,
      total: Number(order.total),
      isTest: order.is_test,
      items: items ?? [],
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

    const { error } = await supabaseAdmin.from("user_roles").upsert(
      [
        { user_id: data.userId, role: "owner" as const },
        { user_id: data.userId, role: "admin" as const },
      ],
      { onConflict: "user_id,role" },
    );
    if (error) return { ok: false, error: "Nu am putut acorda accesul." };
    return { ok: true };
  });
