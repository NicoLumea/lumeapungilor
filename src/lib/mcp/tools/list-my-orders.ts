import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "List my orders",
  description: "List the signed-in customer's recent orders with status and total.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .select("order_number, status, payment_status, total, currency, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const orders = (data ?? []).map((o) => ({
      orderNumber: o.order_number, status: o.status, paymentStatus: o.payment_status,
      total: o.total, currency: o.currency, createdAt: o.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(orders) }], structuredContent: { orders } };
  },
});
