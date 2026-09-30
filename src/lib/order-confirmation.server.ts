import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isAuthorizedOrder } from "./order-access.ts";

export type ConfirmationItem = {
  id: string;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type ConfirmationOrder = {
  order_number: string;
  created_at: string;
  contact_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  cui: string | null;
  reg_com: string | null;
  billing_address: string | null;
  delivery_address: string | null;
  city: string | null;
  county: string | null;
  postal_code: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  currency: string;
  order_items: ConfirmationItem[];
};

async function tokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function readAuthorizedOrder(
  number: string,
  accessToken: string | undefined,
  authHeader: string | undefined,
): Promise<ConfirmationOrder | null> {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,user_id,order_number,created_at,contact_name,email,phone,company_name,cui,reg_com,billing_address,delivery_address,city,county,postal_code,status,payment_status,subtotal,shipping_total,tax_total,total,currency,order_items(id,product_name,variant_name,sku,product_image_url,quantity,unit_price,line_total)",
    )
    .eq("order_number", number)
    .maybeSingle();
  if (error || !order) return null;

  let authenticatedUserId: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    authenticatedUserId = data.user?.id ?? null;
  }
  let storedGuestHash: string | null = null;
  let presentedGuestHash: string | null = null;
  if (!order.user_id && accessToken && /^[a-f0-9]{64}$/.test(accessToken)) {
    const { data: guestAccess } = await supabaseAdmin
      .from("guest_order_access")
      .select("token_hash")
      .eq("order_id", order.id)
      .maybeSingle();
    storedGuestHash = guestAccess?.token_hash ?? null;
    presentedGuestHash = await tokenHash(accessToken);
  }
  if (!isAuthorizedOrder(order.user_id, authenticatedUserId, storedGuestHash, presentedGuestHash))
    return null;
  const { id: _id, user_id: _userId, ...safeOrder } = order;
  void _id;
  void _userId;
  return safeOrder as ConfirmationOrder;
}
