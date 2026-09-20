import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  email: z.string().trim().email().max(200),
  consent: z.literal(true),
});

export type RestockResult = { ok: true; alreadyActive: boolean } | { ok: false; error: string };

/** Customer-facing: register a back-in-stock notification request. */
export const requestRestockNotice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ data }): Promise<RestockResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { checkRateLimit } = await import("./rate-limit.server");

    const email = data.email.trim().toLowerCase();
    const throttle = await checkRateLimit("restock", email, 10, 3600);
    if (!throttle.allowed) {
      return { ok: false, error: "Prea multe cereri. Te rugăm să reîncerci mai târziu." };
    }

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id,status,is_archived")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product || product.status !== "published" || product.is_archived) {
      return { ok: false, error: "Produsul nu mai este disponibil." };
    }

    const { data: existing } = await supabaseAdmin
      .from("restock_requests")
      .select("id")
      .eq("product_id", data.productId)
      .eq("status", "activ")
      .ilike("email", email)
      .maybeSingle();
    if (existing) return { ok: true, alreadyActive: true };

    const { error } = await supabaseAdmin.from("restock_requests").insert({
      product_id: data.productId,
      variant_id: data.variantId ?? null,
      email,
      status: "activ",
    });
    // A parallel submit hitting the unique index is not an error for the customer.
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: "Cererea nu a putut fi salvată. Te rugăm să încerci din nou." };
    }
    return { ok: true, alreadyActive: !!error };
  });

/** Public unsubscribe by token. */
export const cancelRestockNotice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("restock_requests")
      .update({ status: "dezabonat" })
      .eq("unsubscribe_token", data.token);
    return { ok: !error };
  });
