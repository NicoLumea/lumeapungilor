import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IMAGE_BUCKET } from "@/lib/images";
import { PRODUCT_SELECT, type Product } from "@/lib/shop-types";
import { slugify } from "@/lib/format";

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function useNewOrderCount() {
  return useQuery({
    queryKey: ["admin", "new-order-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "nou");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export async function uploadProductImage(file: File, descriptiveName?: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const sourceName = descriptiveName || file.name.replace(/\.[^.]+$/, "") || "imagine";
  const safeName = slugify(sourceName).slice(0, 80) || "imagine";
  const path = `${safeName}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}
