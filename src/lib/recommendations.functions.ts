import { createServerFn } from "@tanstack/react-start";

export type Recommendations = {
  /** true only when real completed-order sales data ranked the list. */
  fromSales: boolean;
  productIds: string[];
};

/** Ranks products by genuine confirmed-order quantities; empty when no sales exist. */
export const getTopSellingProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Recommendations> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("top_selling_products", { p_limit: 5 });
    if (error || !data || data.length === 0) return { fromSales: false, productIds: [] };
    return {
      fromSales: true,
      productIds: (data as { product_id: string }[]).map((row) => row.product_id),
    };
  },
);
