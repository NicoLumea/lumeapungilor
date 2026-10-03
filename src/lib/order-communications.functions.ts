import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orderMailText, type OrderMail } from "./order-mail";
import type { ConfirmationOrder } from "./order-confirmation.server";

const idInput = z.object({ orderId: z.string().uuid() });
async function staff(userId: string) {
  const { hasPrivilegedAccess } = await import("./authorization.server");
  if (!(await hasPrivilegedAccess(userId, "employee"))) throw new Error("Acces interzis.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // New tables ship with this feature's migration; isolate the pre-generated client types.
  return supabaseAdmin as unknown as SupabaseClient;
}
function checked(error: { message: string } | null) {
  if (error) {
    console.error("Order communications:", error.message);
    throw new Error(
      "Operațiunea nu a reușit. Reîncarcă pagina; verifică dacă actualizarea bazei de date a fost aplicată.",
    );
  }
}

export const getOrderCommunications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => idInput.parse(v))
  .handler(async ({ data, context }) => {
    const db = await staff(context.userId);
    const [legal, invoices, history] = await Promise.all([
      db
        .from("order_legal_snapshots")
        .select("source,captured_at")
        .eq("order_id", data.orderId)
        .maybeSingle(),
      db
        .from("order_invoices")
        .select("id,invoice_number,created_at")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: false }),
      db
        .from("order_email_drafts")
        .select("id,kind,actor_email,actor_id,declared_sent_at")
        .eq("order_id", data.orderId)
        .not("declared_sent_at", "is", null)
        .order("declared_sent_at", { ascending: false }),
    ]);
    [legal, invoices, history].forEach((r) => checked(r.error));
    return {
      legal: legal.data as { source: string; captured_at: string } | null,
      invoices: invoices.data as { id: string; invoice_number: string; created_at: string }[],
      history: history.data as {
        id: string;
        kind: string;
        actor_email: string;
        actor_id: string;
        declared_sent_at: string;
      }[],
    };
  });

export const supplyLegacyTerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    idInput.extend({ terms: z.string().trim().min(100).max(150000) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const db = await staff(context.userId);
    const { error } = await db.from("order_legal_snapshots").insert({
      order_id: data.orderId,
      terms: data.terms,
      source: "staff_legacy",
      supplied_by: context.userId,
    });
    checked(error);
    return { ok: true };
  });

export const prepareOrderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    idInput
      .extend({
        kind: z.enum(["acceptance", "dispatch"]),
        tracking: z
          .string()
          .trim()
          .max(100)
          .regex(/^[\p{L}\p{N} ._/-]*$/u)
          .default(""),
        invoiceId: z.string().uuid().optional(),
        version: z.string().datetime({ offset: true }),
      })
      .parse(v),
  )
  .handler(async ({ data, context }): Promise<OrderMail> => {
    const db = await staff(context.userId);
    const { data: o, error } = await db
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", data.orderId)
      .single();
    checked(error);
    if (!o || Date.parse(o.updated_at) !== Date.parse(data.version))
      throw new Error("Comanda s-a schimbat. Reîncarcă pagina.");
    if (o.status === "anulat") throw new Error("Comanda este anulată.");
    if (data.kind === "dispatch" && !["confirmat", "in_livrare"].includes(o.status))
      throw new Error("Acceptă comanda înainte de predarea la curier.");
    const attachments: OrderMail["attachments"] = [];
    let invoiceUrl: string | undefined;
    let invoiceNumber: string | undefined;
    if (data.invoiceId) {
      const { data: invoice, error: e } = await db
        .from("order_invoices")
        .select("*")
        .eq("id", data.invoiceId)
        .eq("order_id", o.id)
        .single();
      checked(e);
      if (!invoice) throw new Error("Factura nu a fost găsită.");
      const signed = await db.storage
        .from("order-invoices")
        .createSignedUrl(invoice.storage_path, 120, { download: "factura.pdf" });
      checked(signed.error);
      invoiceUrl = signed.data?.signedUrl;
      invoiceNumber = invoice.invoice_number;
    }
    const { subject, body } = orderMailText(
      o as ConfirmationOrder,
      data.kind,
      data.tracking,
      invoiceNumber,
    );
    const { data: actor, error: actorError } = await db.auth.admin.getUserById(context.userId);
    checked(actorError);
    const { data: draft, error: draftError } = await db
      .from("order_email_drafts")
      .insert({
        order_id: o.id,
        kind: data.kind,
        actor_id: context.userId,
        actor_email: actor.user?.email || context.userId,
        order_version: o.updated_at,
        recipient: o.email,
        subject,
        body,
        tracking: data.tracking,
        invoice_id: data.invoiceId ?? null,
      })
      .select("id")
      .single();
    checked(draftError);
    return {
      id: draft!.id,
      recipient: o.email,
      subject,
      body,
      attachments,
      invoiceUrl,
    };
  });

export const saveOrderOperations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    idInput
      .extend({
        version: z.string(),
        status: z.enum(["nou", "confirmat", "in_livrare", "finalizat", "anulat"]),
        payment: z.enum(["in_asteptare", "platit", "rambursat", "anulat"]),
        note: z.string().max(10000),
        draftId: z.string().uuid().optional(),
        confirmed: z.boolean(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    await staff(context.userId);
    const { error } = await (context.supabase as unknown as SupabaseClient).rpc(
      "save_order_operations",
      {
        p_id: data.orderId,
        p_version: data.version,
        p_status: data.status,
        p_payment: data.payment,
        p_note: data.note,
        p_draft: data.draftId ?? null,
        p_confirmed: data.confirmed,
      },
    );
    checked(error);
    return { ok: true };
  });

export const confirmInvoiceEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ draftId: z.string().uuid(), confirmed: z.literal(true) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    await staff(context.userId);
    const { error } = await (context.supabase as unknown as SupabaseClient).rpc(
      "confirm_invoice_email",
      { p_draft: data.draftId },
    );
    checked(error);
    return { ok: true };
  });

export const uploadOrderInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    idInput
      .extend({
        invoiceNumber: z.string().trim().min(1).max(100),
        base64: z.string().max(13981016),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const db = await staff(context.userId);
    const { data: order, error: oe } = await db
      .from("orders")
      .select("status")
      .eq("id", data.orderId)
      .single();
    checked(oe);
    if (!order || !["confirmat", "in_livrare", "finalizat"].includes(order.status))
      throw new Error("Factura poate fi adăugată după acceptarea comenzii.");
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { validateInvoicePdf } = await import("./invoice-pdf.server");
    await validateInvoicePdf(bytes);
    const path = `${data.orderId}/${crypto.randomUUID()}.pdf`;
    const { error } = await db.storage
      .from("order-invoices")
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    checked(error);
    const { error: insertError } = await db.from("order_invoices").insert({
      order_id: data.orderId,
      storage_path: path,
      invoice_number: data.invoiceNumber,
      uploaded_by: context.userId,
    });
    if (insertError) await db.storage.from("order-invoices").remove([path]);
    checked(insertError);
    return { ok: true };
  });

export const getCustomerInvoices = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) =>
    z
      .object({
        number: z.string().min(3).max(40),
        accessToken: z
          .string()
          .regex(/^[a-f0-9]{64}$/)
          .optional(),
      })
      .parse(v),
  )
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { readAuthorizedOrder } = await import("./order-confirmation.server");
    const order = await readAuthorizedOrder(
      data.number,
      data.accessToken,
      getRequestHeader("authorization"),
    );
    if (!order) throw new Error("Comanda nu este disponibilă.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as SupabaseClient;
    const { data: o, error } = await db
      .from("orders")
      .select("id")
      .eq("order_number", order.order_number)
      .single();
    checked(error);
    const { data: invoices, error: e } = await db
      .from("order_invoices")
      .select("id,invoice_number,storage_path")
      .eq("order_id", o!.id)
      .order("created_at", { ascending: false });
    checked(e);
    return await Promise.all(
      (invoices ?? []).map(async (i) => {
        const signed = await db.storage
          .from("order-invoices")
          .createSignedUrl(i.storage_path, 120, { download: "factura.pdf" });
        checked(signed.error);
        return {
          id: i.id as string,
          number: i.invoice_number as string,
          url: signed.data!.signedUrl,
        };
      }),
    );
  });
