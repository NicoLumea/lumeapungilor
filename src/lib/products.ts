import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_SELECT, specList, type Product } from "@/lib/shop-types";

function normalize(row: Record<string, unknown>): Product {
  return { ...(row as unknown as Product), specs: specList(row["specs"]) };
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .eq("is_archived", false)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => normalize(d as unknown as Record<string, unknown>));
}

export function usePublishedProducts() {
  return useQuery({ queryKey: ["products", "published"], queryFn: fetchPublishedProducts });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normalize(data as unknown as Record<string, unknown>) : null;
    },
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ["products", "byIds", [...ids].sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .in("id", ids);
      if (error) throw error;
      return (data ?? []).map((d) => normalize(d as unknown as Record<string, unknown>));
    },
  });
}
