import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description: "Search the published Lumea Pungilor catalogue by product name.",
  inputSchema: {
    query: z.string().trim().max(100).optional().describe("Text to search in product names."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("products")
      .select("name, slug, price, currency, selling_unit, stock, sku")
      .eq("status", "published")
      .eq("is_archived", false)
      .order("sort_order")
      .limit(limit ?? 20);
    if (query) q = q.ilike("name", `%${query.replace(/[%_,()]/g, " ")}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const products = (data ?? []).map((p) => ({
      name: p.name, slug: p.slug, price: p.price, currency: p.currency,
      unit: p.selling_unit, stock: p.stock, sku: p.sku,
    }));
    return { content: [{ type: "text", text: JSON.stringify(products) }], structuredContent: { products } };
  },
});
