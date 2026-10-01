import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const feedbackSchema = z.object({
  feedbackType: z.enum(["website", "product", "experience"]),
  productId: z.string().uuid().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  message: z.string().trim().min(10).max(3000),
  email: z.string().trim().email().max(200),
  orderNumber: z.string().trim().max(40).optional(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => feedbackSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { checkRateLimit } = await import("./rate-limit.server");
    let userId: string | null = null;
    let email = data.email.toLowerCase();
    const header = getRequestHeader("authorization");
    if (header?.startsWith("Bearer ")) {
      const { data: identity } = await supabaseAdmin.auth.getUser(header.slice(7));
      if (identity.user) {
        userId = identity.user.id;
        email = identity.user.email?.toLowerCase() ?? email;
      }
    }
    const limit = await checkRateLimit("feedback", email, 5, 3600);
    if (!limit.allowed)
      return { ok: false, error: "Ai trimis prea mult feedback. Încearcă mai târziu." };

    if (data.feedbackType === "product" && !data.productId) {
      return { ok: false, error: "Alege produsul despre care vrei să scrii." };
    }
    let productId: string | null = null;
    if (data.feedbackType === "product" && data.productId) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("id", data.productId)
        .eq("status", "published")
        .eq("is_archived", false)
        .maybeSingle();
      if (!product) return { ok: false, error: "Produsul selectat nu este disponibil." };
      productId = product.id;
    }
    const number = data.orderNumber?.trim().toUpperCase() || null;
    let orderId: string | null = null;
    if (number && userId) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("order_number", number)
        .eq("user_id", userId)
        .maybeSingle();
      orderId = order?.id ?? null;
    }
    const { error } = await supabaseAdmin.from("customer_feedback").insert({
      user_id: userId,
      email,
      feedback_type: data.feedbackType,
      product_id: productId,
      order_id: orderId,
      order_number: number,
      rating: data.rating,
      message: data.message,
    });
    return error ? { ok: false, error: "Feedbackul nu a putut fi trimis." } : { ok: true };
  });
