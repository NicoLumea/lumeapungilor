import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  EVIDENCE_REASONS,
  MAX_RETURN_IMAGE_BYTES,
  MAX_RETURN_IMAGES,
  RETURN_IMAGE_MIME_TYPES,
  RETURN_REASONS,
  imageSignatureMatches,
  isPaidStatus,
  validRequestedQuantity,
} from "@/lib/returns-core";

const PAID_ERROR = "Cererea poate fi trimisă numai pentru o comandă marcată ca achitată.";
const GENERIC_ORDER_ERROR = "Nu am găsit o comandă eligibilă cu aceste date.";

const imageSchema = z.object({
  name: z.string().trim().min(1).max(180),
  mime: z.enum(RETURN_IMAGE_MIME_TYPES),
  size: z.number().int().positive().max(MAX_RETURN_IMAGE_BYTES),
  base64: z
    .string()
    .min(4)
    .max(Math.ceil((MAX_RETURN_IMAGE_BYTES * 4) / 3) + 16),
});

const requestSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  requestedQuantity: z.number().int().positive(),
  reason: z.enum(RETURN_REASONS),
  description: z.string().trim().min(10).max(3000),
  images: z.array(imageSchema).max(MAX_RETURN_IMAGES),
  idempotencyKey: z.string().uuid(),
});

type RequestInput = z.infer<typeof requestSchema>;
type ReturnActionResult = { ok: true; requestId: string } | { ok: false; error: string };

export type EligibleReturnOrder = {
  id: string;
  order_number: string;
  payment_status: string;
  created_at: string;
  contact_name: string;
  email: string;
  phone: string | null;
  items: Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
  }>;
};

function safeFileExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function tokenHash(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

async function persistReturn(
  input: RequestInput,
  order: {
    id: string;
    order_number: string;
    user_id: string | null;
    email: string;
    payment_status: string;
    order_items: Array<{
      id: string;
      product_name: string;
      variant_name: string | null;
      quantity: number;
    }>;
  },
  userId: string | null,
): Promise<ReturnActionResult> {
  if (!isPaidStatus(order.payment_status)) return { ok: false, error: PAID_ERROR };
  const item = order.order_items.find((candidate) => candidate.id === input.orderItemId);
  if (!item) return { ok: false, error: "Produsul selectat nu aparține comenzii." };
  if (!validRequestedQuantity(input.requestedQuantity, item.quantity))
    return { ok: false, error: "Cantitatea solicitată depășește cantitatea cumpărată." };
  if (EVIDENCE_REASONS.has(input.reason) && input.images.length === 0)
    return {
      ok: false,
      error: "Pentru acest tip de reclamație este necesară cel puțin o fotografie.",
    };

  const decodedImages: Array<{ bytes: Uint8Array; image: RequestInput["images"][number] }> = [];
  for (const image of input.images) {
    const bytes = Uint8Array.from(Buffer.from(image.base64, "base64"));
    if (bytes.byteLength !== image.size || bytes.byteLength > MAX_RETURN_IMAGE_BYTES)
      return { ok: false, error: "Una dintre fotografii depășește limita de 5 MB." };
    if (!imageSignatureMatches(bytes, image.mime))
      return {
        ok: false,
        error: "Conținutul unei fotografii nu corespunde tipului JPG, PNG sau WEBP declarat.",
      };
    decodedImages.push({ bytes, image });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const existingKey = await supabaseAdmin
    .from("return_requests")
    .select("id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existingKey.data) return { ok: true, requestId: existingKey.data.id };

  const duplicates = await supabaseAdmin
    .from("return_requests")
    .select("id,status,reason,return_request_items(order_item_id)")
    .eq("order_id", order.id)
    .eq("reason", input.reason)
    .not("status", "in", "(rejected,closed)");
  const duplicate = (duplicates.data ?? []).some((request) =>
    (request.return_request_items ?? []).some((entry) => entry.order_item_id === item.id),
  );
  if (duplicate)
    return { ok: false, error: "Există deja o cerere activă pentru acest produs și acest motiv." };

  const inserted = await supabaseAdmin
    .from("return_requests")
    .insert({
      order_id: order.id,
      order_number: order.order_number,
      user_id: userId,
      email: input.email.toLowerCase(),
      customer_name: input.customerName,
      customer_phone: input.phone,
      kind: "reclamatie",
      reason: input.reason,
      message: input.description,
      status: "submitted",
      idempotency_key: input.idempotencyKey,
    })
    .select("id")
    .single();
  if (inserted.error?.code === "23505") {
    const raced = await supabaseAdmin
      .from("return_requests")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (raced.data) return { ok: true, requestId: raced.data.id };
  }
  if (inserted.error || !inserted.data)
    return { ok: false, error: "Cererea nu a putut fi înregistrată." };

  const requestId = inserted.data.id;
  const uploaded: string[] = [];
  try {
    const itemInsert = await supabaseAdmin.from("return_request_items").insert({
      return_request_id: requestId,
      order_item_id: item.id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      purchased_quantity: item.quantity,
      requested_quantity: input.requestedQuantity,
    });
    if (itemInsert.error) throw itemInsert.error;

    for (const [index, entry] of decodedImages.entries()) {
      const path = `${requestId}/${crypto.randomUUID()}-${index}.${safeFileExtension(entry.image.mime)}`;
      const upload = await supabaseAdmin.storage.from("return-evidence").upload(path, entry.bytes, {
        contentType: entry.image.mime,
        upsert: false,
      });
      if (upload.error) throw upload.error;
      uploaded.push(path);
      const metadata = await supabaseAdmin.from("return_request_images").insert({
        return_request_id: requestId,
        storage_path: path,
        original_name: entry.image.name,
        mime_type: entry.image.mime,
        size_bytes: entry.bytes.byteLength,
      });
      if (metadata.error) throw metadata.error;
    }
    return { ok: true, requestId };
  } catch {
    if (uploaded.length > 0) await supabaseAdmin.storage.from("return-evidence").remove(uploaded);
    await supabaseAdmin.from("return_requests").delete().eq("id", requestId);
    return { ok: false, error: "Cererea sau fotografiile nu au putut fi salvate." };
  }
}

export const getEligibleReturnOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EligibleReturnOrder[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin
      .from("orders")
      .select(
        "id,order_number,payment_status,created_at,contact_name,email,phone,order_items(id,product_name,variant_name,quantity)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (result.error) throw new Error("Comenzile eligibile nu au putut fi încărcate.");
    return (result.data ?? [])
      .filter((order) => isPaidStatus(order.payment_status))
      .map((order) => ({
        id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        created_at: order.created_at,
        contact_name: order.contact_name,
        email: order.email,
        phone: order.phone,
        items: order.order_items ?? [],
      }));
  });

export const submitAuthenticatedReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ data, context }): Promise<ReturnActionResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin
      .from("orders")
      .select(
        "id,order_number,user_id,email,payment_status,order_items(id,product_name,variant_name,quantity)",
      )
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!result.data) return { ok: false, error: GENERIC_ORDER_ERROR };
    if (result.data.email.toLowerCase() !== data.email.toLowerCase())
      return { ok: false, error: "Adresa de e-mail trebuie să coincidă cu cea a comenzii." };
    return persistReturn(data, result.data, context.userId);
  });

export const verifyGuestReturnOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        orderNumber: z.string().trim().min(3).max(40),
        email: z.string().trim().email().max(200),
      })
      .parse(data),
  )
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; token: string; order: EligibleReturnOrder } | { ok: false; error: string }
    > => {
      const { checkRateLimit } = await import("./rate-limit.server");
      const limit = await checkRateLimit("guest_return_verify", data.email.toLowerCase(), 8, 900);
      if (!limit.allowed)
        return { ok: false, error: "Prea multe încercări. Te rugăm să reîncerci mai târziu." };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const result = await supabaseAdmin
        .from("orders")
        .select(
          "id,order_number,user_id,payment_status,created_at,contact_name,email,phone,order_items(id,product_name,variant_name,quantity)",
        )
        .eq("order_number", data.orderNumber.trim().toUpperCase())
        .ilike("email", data.email.trim())
        .eq("is_guest", true)
        .maybeSingle();
      if (!result.data) return { ok: false, error: GENERIC_ORDER_ERROR };
      if (!isPaidStatus(result.data.payment_status)) return { ok: false, error: PAID_ERROR };
      const { randomBytes } = await import("node:crypto");
      const token = randomBytes(32).toString("base64url");
      const hash = await tokenHash(token);
      const session = await supabaseAdmin.from("guest_return_sessions").insert({
        order_id: result.data.id,
        email: result.data.email.toLowerCase(),
        token_hash: hash,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      if (session.error) return { ok: false, error: "Verificarea nu a putut fi finalizată." };
      return {
        ok: true,
        token,
        order: {
          id: result.data.id,
          order_number: result.data.order_number,
          payment_status: result.data.payment_status,
          created_at: result.data.created_at,
          contact_name: result.data.contact_name,
          email: result.data.email,
          phone: result.data.phone,
          items: result.data.order_items ?? [],
        },
      };
    },
  );

export const submitGuestReturn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    requestSchema.extend({ guestToken: z.string().min(32).max(100) }).parse(data),
  )
  .handler(async ({ data }): Promise<ReturnActionResult> => {
    const { checkRateLimit } = await import("./rate-limit.server");
    const limit = await checkRateLimit("guest_return_submit", data.email.toLowerCase(), 5, 3600);
    if (!limit.allowed)
      return { ok: false, error: "Prea multe cereri. Te rugăm să reîncerci mai târziu." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await tokenHash(data.guestToken);
    const session = await supabaseAdmin
      .from("guest_return_sessions")
      .select("id,order_id,email,expires_at,used_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (
      !session.data ||
      session.data.used_at ||
      new Date(session.data.expires_at).getTime() <= Date.now() ||
      session.data.order_id !== data.orderId ||
      session.data.email !== data.email.toLowerCase()
    )
      return { ok: false, error: "Verificarea comenzii a expirat. Verifică din nou comanda." };
    const order = await supabaseAdmin
      .from("orders")
      .select(
        "id,order_number,user_id,email,payment_status,order_items(id,product_name,variant_name,quantity)",
      )
      .eq("id", session.data.order_id)
      .eq("is_guest", true)
      .maybeSingle();
    if (!order.data) return { ok: false, error: GENERIC_ORDER_ERROR };
    const result = await persistReturn(data, order.data, null);
    if (result.ok)
      await supabaseAdmin
        .from("guest_return_sessions")
        .update({ used_at: new Date().toISOString() })
        .eq("id", session.data.id);
    return result;
  });
